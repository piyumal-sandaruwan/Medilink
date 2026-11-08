import request from 'supertest';
import { setupTestDB, createTestFixtures, app } from './setup.js';

describe('2. Schedule Validation & Overlap Prevention', () => {
  setupTestDB();

  it('rejects schedules with end time before or equal to start time', async () => {
    const { doctorToken, hospital } = await createTestFixtures();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const res = await request(app)
      .post('/api/schedules/mine')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        hospitalId: hospital._id,
        date: futureDate.toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '12:00', // Invalid: end before start
        maxPatients: 20,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/after start time/i);
  });

  it('rejects schedules with dates in the past', async () => {
    const { doctorToken, hospital } = await createTestFixtures();

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const res = await request(app)
      .post('/api/schedules/mine')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        hospitalId: hospital._id,
        date: pastDate.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        maxPatients: 20,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/future/i);
  });

  it('rejects overlapping schedules for the same doctor on the same date at different hospitals', async () => {
    const { doctorToken, hospital, hospital2 } = await createTestFixtures();

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    const dateStr = targetDate.toISOString().split('T')[0];

    // 1. Create morning session at Hospital 1 (09:00 - 12:00)
    const firstRes = await request(app)
      .post('/api/schedules/mine')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        hospitalId: hospital._id,
        date: dateStr,
        startTime: '09:00',
        endTime: '12:00',
        maxPatients: 20,
      });

    expect(firstRes.status).toBe(201);
    expect(firstRes.body.success).toBe(true);

    // 2. Attempt to create overlapping session at Hospital 2 (11:00 - 13:00)
    const overlapRes = await request(app)
      .post('/api/schedules/mine')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        hospitalId: hospital2._id,
        date: dateStr,
        startTime: '11:00', // Overlaps with 09:00-12:00
        endTime: '13:00',
        maxPatients: 15,
      });

    expect(overlapRes.status).toBe(400);
    expect(overlapRes.body.success).toBe(false);
    expect(overlapRes.body.message).toMatch(/overlap/i);

    // 3. Creating a non-overlapping evening session on the same date succeeds
    const nonOverlapRes = await request(app)
      .post('/api/schedules/mine')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        hospitalId: hospital2._id,
        date: dateStr,
        startTime: '15:00',
        endTime: '18:00',
        maxPatients: 15,
      });

    expect(nonOverlapRes.status).toBe(201);
    expect(nonOverlapRes.body.success).toBe(true);
  });
});
