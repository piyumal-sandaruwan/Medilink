import request from 'supertest';
import { setupTestDB, createTestFixtures, app } from './setup.js';
import User from '../src/models/User.js';
import Schedule from '../src/models/Schedule.js';
import { hashPassword, generateToken } from '../src/utils/auth.js';

describe('3. Booking Race Condition & Atomic Concurrency', () => {
  setupTestDB();

  it('guarantees zero overbooking and unique appointment numbers when 30 concurrent requests compete for 5 seats', async () => {
    const { doctor, hospital } = await createTestFixtures();

    // 1. Create a schedule with strictly 5 seats capacity in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const schedule = await Schedule.create({
      doctor: doctor._id,
      hospital: hospital._id,
      date: futureDate,
      startTime: '09:00',
      endTime: '12:00',
      maxPatients: 5,
      bookedCount: 0,
      lastAppointmentNo: 0,
      status: 'active',
    });

    // 2. Pre-create 30 distinct registered patient users with tokens
    const passwordHash = await hashPassword('Password@123');
    const patientUsers = [];
    const patientTokens = [];

    for (let i = 1; i <= 30; i++) {
      const u = await User.create({
        name: `Concurrent Patient ${i}`,
        email: `concur.patient.${i}@medilink.lk`,
        passwordHash,
        phone: `07700000${i.toString().padStart(2, '0')}`,
        role: 'patient',
        isActive: true,
      });
      patientUsers.push(u);
      patientTokens.push(generateToken({ id: u._id, role: 'patient' }));
    }

    expect(patientTokens.length).toBe(30);

    // 3. Fire all 30 requests simultaneously using Promise.all
    const bookingPromises = patientTokens.map((token, index) =>
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduleId: schedule._id.toString(),
          patientNote: `Race test booking attempt from patient ${index + 1}`,
        })
    );

    const results = await Promise.all(bookingPromises);

    // 4. Assert exact counts: exactly 5 succeed (201), exactly 25 fail with conflict/sold out (409)
    const successfulResponses = results.filter((r) => r.status === 201);
    const rejectedResponses = results.filter((r) => r.status === 409);

    expect(successfulResponses.length).toBe(5);
    expect(rejectedResponses.length).toBe(25);

    // 5. Assert all 5 successful appointments received unique appointment numbers (1 to 5)
    const appointmentNumbers = successfulResponses
      .map((r) => r.body.data.appointment.appointmentNo)
      .sort((a, b) => a - b);

    expect(appointmentNumbers).toEqual([1, 2, 3, 4, 5]);

    // 6. Assert schedule state in database
    const updatedScheduleInDb = await Schedule.findById(schedule._id);
    expect(updatedScheduleInDb.bookedCount).toBe(5);
    expect(updatedScheduleInDb.lastAppointmentNo).toBe(5);
  }, 30000);
});
