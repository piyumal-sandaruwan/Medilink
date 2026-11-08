import request from 'supertest';
import { setupTestDB, createTestFixtures, app } from './setup.js';

describe('1. Role-Based Access Control & Protection', () => {
  setupTestDB();

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res1 = await request(app).get('/api/auth/me');
    expect(res1.status).toBe(401);

    const res2 = await request(app).get('/api/doctors/me');
    expect(res2.status).toBe(401);

    const res3 = await request(app).get('/api/appointments/mine');
    expect(res3.status).toBe(401);

    const res4 = await request(app).get('/api/admin/users');
    expect(res4.status).toBe(401);
  });

  it('forbids patients from accessing doctor and admin portals with 403', async () => {
    const fixtures = await createTestFixtures();

    const doctorPortalRes = await request(app)
      .get('/api/doctors/me')
      .set('Authorization', `Bearer ${fixtures.patientToken}`);
    expect(doctorPortalRes.status).toBe(403);

    const adminPortalRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${fixtures.patientToken}`);
    expect(adminPortalRes.status).toBe(403);
  });

  it('forbids doctors from accessing patient booking endpoint and admin portals with 403', async () => {
    const fixtures = await createTestFixtures();

    const bookingRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${fixtures.doctorToken}`)
      .send({ scheduleId: fixtures.hospital._id });
    expect(bookingRes.status).toBe(403);

    const adminRes = await request(app)
      .get('/api/admin/doctors')
      .set('Authorization', `Bearer ${fixtures.doctorToken}`);
    expect(adminRes.status).toBe(403);
  });

  it('permits admins full access to administrative endpoints', async () => {
    const fixtures = await createTestFixtures();

    const usersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${fixtures.adminToken}`);
    expect(usersRes.status).toBe(200);
    expect(usersRes.body.success).toBe(true);

    const statsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${fixtures.adminToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
  });
});
