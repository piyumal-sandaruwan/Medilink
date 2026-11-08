import request from 'supertest';
import { setupTestDB, createTestFixtures, app } from './setup.js';
import Schedule from '../src/models/Schedule.js';
import Appointment from '../src/models/Appointment.js';

describe('4. Cancellation Rules & Cascading Updates', () => {
  setupTestDB();

  it('permits patient cancellation when session is more than 2 hours away and decrements booked count', async () => {
    const { doctor, hospital, patientToken, patientUser } = await createTestFixtures();

    // Session 3 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const schedule = await Schedule.create({
      doctor: doctor._id,
      hospital: hospital._id,
      date: futureDate,
      startTime: '10:00',
      endTime: '13:00',
      maxPatients: 10,
      bookedCount: 0,
      lastAppointmentNo: 0,
      status: 'active',
    });

    // Book appointment
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ scheduleId: schedule._id.toString() });

    expect(bookRes.status).toBe(201);
    const appointmentId = bookRes.body.data.appointment._id;

    const scheduleAfterBooking = await Schedule.findById(schedule._id);
    expect(scheduleAfterBooking.bookedCount).toBe(1);
    expect(scheduleAfterBooking.lastAppointmentNo).toBe(1);

    // Cancel appointment (allowed because > 2 hours away)
    const cancelRes = await request(app)
      .patch(`/api/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // Verify bookedCount decremented back to 0, but lastAppointmentNo stays 1 (never reused!)
    const scheduleAfterCancel = await Schedule.findById(schedule._id);
    expect(scheduleAfterCancel.bookedCount).toBe(0);
    expect(scheduleAfterCancel.lastAppointmentNo).toBe(1);

    const cancelledAppt = await Appointment.findById(appointmentId);
    expect(cancelledAppt.status).toBe('cancelled');
    expect(cancelledAppt.cancelledBy.toString()).toBe(patientUser._id.toString());
  });


  it('releases a reserved seat only once when duplicate cancellation requests race', async () => {
    const { doctor, hospital, patientToken } = await createTestFixtures();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const schedule = await Schedule.create({
      doctor: doctor._id,
      hospital: hospital._id,
      date: futureDate,
      startTime: '10:00',
      endTime: '12:00',
      maxPatients: 5,
      bookedCount: 0,
      lastAppointmentNo: 0,
      status: 'active',
    });

    const booking = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ scheduleId: schedule._id.toString() });
    expect(booking.status).toBe(201);

    const appointmentId = booking.body.data.appointment._id;
    const cancelRequests = await Promise.all([
      request(app).patch(`/api/appointments/${appointmentId}/cancel`).set('Authorization', `Bearer ${patientToken}`),
      request(app).patch(`/api/appointments/${appointmentId}/cancel`).set('Authorization', `Bearer ${patientToken}`),
    ]);

    expect(cancelRequests.filter((response) => response.status === 200)).toHaveLength(1);
    expect(cancelRequests.filter((response) => response.status === 409)).toHaveLength(1);
    const finalSchedule = await Schedule.findById(schedule._id);
    expect(finalSchedule.bookedCount).toBe(0);
  });

  it('rejects patient cancellation when session starts in less than 2 hours', async () => {
    const { doctor, hospital, patientToken, patientUser } = await createTestFixtures();

    // Create a session starting 1 hour from now
    const nearDate = new Date();
    const oneHourLater = new Date(nearDate.getTime() + 60 * 60 * 1000);
    const startTimeStr = `${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const endTimeStr = '23:59';

    const schedule = await Schedule.create({
      doctor: doctor._id,
      hospital: hospital._id,
      date: nearDate,
      startTime: startTimeStr,
      endTime: endTimeStr,
      maxPatients: 10,
      bookedCount: 1,
      lastAppointmentNo: 1,
      status: 'active',
    });

    const appointment = await Appointment.create({
      patient: patientUser._id,
      schedule: schedule._id,
      appointmentNo: 1,
      status: 'booked',
    });

    // Attempt cancellation within 2-hour window
    const cancelRes = await request(app)
      .patch(`/api/appointments/${appointment._id}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(cancelRes.status).toBe(400);
    expect(cancelRes.body.success).toBe(false);
    expect(cancelRes.body.message).toMatch(/2 hours/i);

    // Verify appointment remains booked
    const apptInDb = await Appointment.findById(appointment._id);
    expect(apptInDb.status).toBe('booked');
  });

  it('doctor cancelling a schedule cascades to cancel all associated booked appointments', async () => {
    const { doctor, doctorToken, hospital, patientUser } = await createTestFixtures();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);

    const schedule = await Schedule.create({
      doctor: doctor._id,
      hospital: hospital._id,
      date: futureDate,
      startTime: '14:00',
      endTime: '17:00',
      maxPatients: 10,
      bookedCount: 2,
      lastAppointmentNo: 2,
      status: 'active',
    });

    // Create 2 distinct patients (respecting partial unique index of 1 active booking per patient)
    const passwordHash = await import('../src/utils/auth.js').then((m) => m.hashPassword('Password@123'));
    const User = (await import('../src/models/User.js')).default;
    const patientUser2 = await User.create({
      name: 'Second Patient',
      email: 'second.patient@medilink.lk',
      passwordHash,
      phone: '0779988778',
      role: 'patient',
      isActive: true,
    });

    const appt1 = await Appointment.create({
      patient: patientUser._id,
      schedule: schedule._id,
      appointmentNo: 1,
      status: 'booked',
    });

    const appt2 = await Appointment.create({
      patient: patientUser2._id,
      schedule: schedule._id,
      appointmentNo: 2,
      status: 'booked',
    });

    // Doctor cancels the schedule
    const cancelScheduleRes = await request(app)
      .patch(`/api/schedules/${schedule._id}/cancel`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(cancelScheduleRes.status).toBe(200);
    expect(cancelScheduleRes.body.success).toBe(true);

    // Assert schedule is marked cancelled
    const scheduleInDb = await Schedule.findById(schedule._id);
    expect(scheduleInDb.status).toBe('cancelled');

    // Assert all associated appointments are marked cancelled
    const apptsInDb = await Appointment.find({ schedule: schedule._id });
    expect(apptsInDb.length).toBe(2);
    expect(apptsInDb[0].status).toBe('cancelled');
    expect(apptsInDb[1].status).toBe('cancelled');
  });
});
