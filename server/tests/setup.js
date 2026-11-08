import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { hashPassword, generateToken } from '../src/utils/auth.js';
import {
  User,
  Doctor,
  Hospital,
  Specialization,
  DoctorHospital,
  Schedule,
  Appointment,
  Payment,
} from '../src/models/index.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-jest-suites-123456';
process.env.JWT_EXPIRES_IN = '1d';

let mongoServer;
export const app = createApp();

export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });
};

/**
 * Fixture generator for test suites
 */
export const createTestFixtures = async () => {
  const passwordHash = await hashPassword('Password@123');

  // 1. Admin
  const adminUser = await User.create({
    name: 'Test Admin',
    email: 'admin.test@medilink.lk',
    passwordHash,
    phone: '0112111111',
    role: 'admin',
    isActive: true,
  });
  const adminToken = generateToken({ id: adminUser._id, role: 'admin' });

  // 2. Specialization & Hospital
  const spec = await Specialization.create({ name: 'Cardiology' });
  const hospital = await Hospital.create({
    name: 'Asiri Central Hospital',
    registrationNo: 'PV-9999',
    type: 'hospital',
    city: 'Colombo',
    address: '114 Norris Canal Rd',
    phone: '0114524400',
    isActive: true,
  });

  const hospital2 = await Hospital.create({
    name: 'Lanka Hospitals',
    registrationNo: 'PV-8888',
    type: 'hospital',
    city: 'Colombo',
    address: '578 Elvitigala Mawatha',
    phone: '0115430000',
    isActive: true,
  });

  // 3. Doctor User & Profile (Approved)
  const doctorUser = await User.create({
    name: 'Dr. Test Doctor',
    email: 'doctor.test@medilink.lk',
    passwordHash,
    phone: '0771122334',
    role: 'doctor',
    isActive: true,
  });
  const doctor = await Doctor.create({
    user: doctorUser._id,
    specialization: spec._id,
    slmcNo: 'SLMC-99999',
    experienceYears: 15,
    channelingFee: 3000,
    approvalStatus: 'approved',
  });
  const doctorToken = generateToken({ id: doctorUser._id, role: 'doctor' });

  // DoctorHospital approved affiliations
  await DoctorHospital.create({
    doctor: doctor._id,
    hospital: hospital._id,
    status: 'approved',
  });
  await DoctorHospital.create({
    doctor: doctor._id,
    hospital: hospital2._id,
    status: 'approved',
  });

  // 4. Hospital Admin User
  const hospAdminUser = await User.create({
    name: 'Test Hosp Admin',
    email: 'hospadmin.test@medilink.lk',
    passwordHash,
    phone: '0114524401',
    role: 'hospital_admin',
    hospital: hospital._id,
    isActive: true,
  });
  const hospAdminToken = generateToken({ id: hospAdminUser._id, role: 'hospital_admin' });

  // 5. Patient User
  const patientUser = await User.create({
    name: 'Test Patient',
    email: 'patient.test@medilink.lk',
    passwordHash,
    phone: '0779988776',
    role: 'patient',
    isActive: true,
  });
  const patientToken = generateToken({ id: patientUser._id, role: 'patient' });

  return {
    adminUser,
    adminToken,
    spec,
    hospital,
    hospital2,
    doctorUser,
    doctor,
    doctorToken,
    hospAdminUser,
    hospAdminToken,
    patientUser,
    patientToken,
  };
};

export default {
  setupTestDB,
  createTestFixtures,
  app,
};
