import request from 'supertest';
import { setupTestDB, createTestFixtures, app } from './setup.js';
import Schedule from '../src/models/Schedule.js';

describe('5. End-to-End Workflow Smoke Test', () => {
  setupTestDB();

  it('completes the full channeling lifecycle: register -> search -> book -> pay -> view -> cancel', async () => {
    const { doctor, hospital } = await createTestFixtures();

    // 1. Create a future schedule
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 6);

    const schedule = await Schedule.create({
      doctor: doctor._id,
      hospital: hospital._id,
      date: futureDate,
      startTime: '08:30',
      endTime: '11:30',
      maxPatients: 15,
      bookedCount: 0,
      lastAppointmentNo: 0,
      status: 'active',
    });

    // 2. Patient Registration
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Smoke Test Patient',
      email: 'smoke.patient@medilink.lk',
      password: 'Password@123',
      phone: '0778899001',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    const patientToken = registerRes.body.data.token;
    expect(patientToken).toBeDefined();

    // 3. Search Doctors
    const searchRes = await request(app).get('/api/doctors?specialization=Cardiology');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.doctors.length).toBeGreaterThan(0);

    // 4. View Doctor Profile Details
    const doctorDetailRes = await request(app).get(`/api/doctors/${doctor._id}`);
    expect(doctorDetailRes.status).toBe(200);
    expect(doctorDetailRes.body.data.upcomingSchedules.length).toBeGreaterThan(0);

    // 5. Book Channeling Appointment
    const bookingRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        scheduleId: schedule._id.toString(),
        patientNote: 'Annual cardiovascular checkup.',
      });

    expect(bookingRes.status).toBe(201);
    const appointment = bookingRes.body.data.appointment;
    expect(appointment.appointmentNo).toBe(1);
    expect(appointment.status).toBe('booked');

    // 6. Complete Simulated Payment
    const paymentRes = await request(app)
      .post(`/api/payments/${appointment._id}/pay`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(paymentRes.status).toBe(200);
    expect(paymentRes.body.data.payment.status).toBe('paid');
    expect(paymentRes.body.data.payment.transactionRef).toMatch(/^TXN-MLK-/);

    // 7. View In Patient's Appointments
    const myApptsRes = await request(app)
      .get('/api/appointments/mine')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(myApptsRes.status).toBe(200);
    expect(myApptsRes.body.data.length).toBe(1);
    expect(myApptsRes.body.data[0].payment.status).toBe('paid');

    // 8. Cancel Appointment
    const cancelRes = await request(app)
      .patch(`/api/appointments/${appointment._id}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.appointment.status).toBe('cancelled');
    expect(cancelRes.body.data.payment.status).toBe('refunded');
  });
});
