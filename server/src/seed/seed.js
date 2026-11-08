import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import config from '../config/env.js';
import connectDB, { disconnectDB } from '../config/db.js';
import { hashPassword } from '../utils/auth.js';
import {
  User,
  Specialization,
  Hospital,
  Doctor,
  DoctorHospital,
  Schedule,
  Appointment,
  Payment,
} from '../models/index.js';

const seedData = async () => {
  console.log('\n======================================================');
  console.log('   Starting MediLink Idempotent Database Seeding...   ');
  console.log('======================================================\n');

  try {
    await connectDB();

    console.log('[1/7] Seeding Specializations...');
    const specializationsData = [
      { name: 'Cardiology' },
      { name: 'Dermatology' },
      { name: 'Neurology' },
      { name: 'Pediatrics' },
      { name: 'Orthopedics' },
      { name: 'Ophthalmology' },
      { name: 'Obstetrics & Gynecology' },
      { name: 'General Medicine' },
      { name: 'Psychiatry' },
      { name: 'ENT (Ear, Nose & Throat)' },
    ];

    const specMap = new Map();
    for (const spec of specializationsData) {
      const doc = await Specialization.findOneAndUpdate(
        { name: spec.name },
        { name: spec.name },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      specMap.set(spec.name, doc._id);
    }
    console.log(`  -> ${specMap.size} specializations ensured.`);

    console.log('[2/7] Seeding Sri Lankan Hospitals...');
    const hospitalsData = [
      {
        name: 'Asiri Central Hospital',
        registrationNo: 'PV-9021',
        type: 'hospital',
        city: 'Colombo',
        address: '114 Norris Canal Road, Colombo 10',
        phone: '0114524400',
        image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Lanka Hospitals',
        registrationNo: 'PV-4412',
        type: 'hospital',
        city: 'Colombo',
        address: '578 Elvitigala Mawatha, Colombo 05',
        phone: '0115430000',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Nawaloka Hospital',
        registrationNo: 'PV-1189',
        type: 'hospital',
        city: 'Colombo',
        address: '23 Deshamanya H. K. Dharmadasa Mawatha, Colombo 02',
        phone: '0115577111',
        image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Durdans Hospital',
        registrationNo: 'PV-3320',
        type: 'hospital',
        city: 'Colombo',
        address: '3 Alfred Place, Colombo 03',
        phone: '0112140000',
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Kings Hospital Colombo',
        registrationNo: 'PV-7744',
        type: 'hospital',
        city: 'Colombo',
        address: '18/A Evergreen Park Road, Colombo 05',
        phone: '0117743743',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Hemas Hospital Wattala',
        registrationNo: 'PV-6621',
        type: 'hospital',
        city: 'Gampaha',
        address: '389 Negombo Road, Wattala',
        phone: '0117888888',
        image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Asiri Surgical Hospital',
        registrationNo: 'PV-8833',
        type: 'hospital',
        city: 'Colombo',
        address: '21 Kirimandala Mawatha, Colombo 05',
        phone: '0114524444',
        image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Ninewells Hospital',
        registrationNo: 'PV-5510',
        type: 'channeling_centre',
        city: 'Colombo',
        address: '55/1 Kirimandala Mawatha, Colombo 05',
        phone: '0112049999',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      },
    ];

    const hospitalMap = new Map();
    for (const h of hospitalsData) {
      const doc = await Hospital.findOneAndUpdate(
        { registrationNo: h.registrationNo },
        { ...h, isActive: true },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      hospitalMap.set(h.name, doc._id);
    }
    console.log(`  -> ${hospitalMap.size} hospitals ensured.`);

    console.log('[3/7] Seeding Platform Admin, Hospital Admin, and Demo Patients...');
    const adminPasswordHash = await hashPassword(config.seed.adminPassword);
    const adminUser = await User.findOneAndUpdate(
      { email: config.seed.adminEmail },
      {
        name: 'MediLink Platform Admin',
        email: config.seed.adminEmail,
        passwordHash: adminPasswordHash,
        phone: '0112000000',
        role: 'admin',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const asiriCentralId = hospitalMap.get('Asiri Central Hospital');
    const hospAdminPass = await hashPassword('HospAdmin@123');
    const hospitalAdminUser = await User.findOneAndUpdate(
      { email: 'hospital.admin@medilink.lk' },
      {
        name: 'Asiri Central Administrator',
        email: 'hospital.admin@medilink.lk',
        passwordHash: hospAdminPass,
        phone: '0114524401',
        role: 'hospital_admin',
        hospital: asiriCentralId,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const patientPass = await hashPassword('Patient@123');
    const patient1 = await User.findOneAndUpdate(
      { email: 'patient1@medilink.lk' },
      {
        name: 'Kasun Perera',
        email: 'patient1@medilink.lk',
        passwordHash: patientPass,
        phone: '0771234567',
        role: 'patient',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const patient2 = await User.findOneAndUpdate(
      { email: 'patient2@medilink.lk' },
      {
        name: 'Nimali Silva',
        email: 'patient2@medilink.lk',
        passwordHash: patientPass,
        phone: '0719876543',
        role: 'patient',
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('  -> Admin, hospital admin, and 2 demo patients ready.');

    console.log('[4/7] Seeding 12 Approved Doctors & Affiliations...');
    const doctorPass = await hashPassword('Doctor@123');
    const doctorsData = [
      {
        name: 'Dr. Anura Senanayake',
        email: 'anura.senanayake@medilink.lk',
        phone: '0772233441',
        spec: 'Cardiology',
        slmcNo: 'SLMC-18492',
        experienceYears: 18,
        channelingFee: 3500,
        bio: 'Senior Consultant Cardiologist with extensive clinical experience in interventional cardiology and cardiovascular risk management.',
        hospitals: ['Asiri Central Hospital', 'Lanka Hospitals', 'Durdans Hospital'],
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Priyantha Dissanayake',
        email: 'priyantha.d@medilink.lk',
        phone: '0773344552',
        spec: 'Cardiology',
        slmcNo: 'SLMC-19503',
        experienceYears: 14,
        channelingFee: 3200,
        bio: 'Cardiologist specializing in hypertension, heart failure management, and preventive echocardiography.',
        hospitals: ['Nawaloka Hospital', 'Kings Hospital Colombo'],
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Malini Jayawardena',
        email: 'malini.j@medilink.lk',
        phone: '0774455663',
        spec: 'Dermatology',
        slmcNo: 'SLMC-22314',
        experienceYears: 12,
        channelingFee: 2800,
        bio: 'Consultant Dermatologist treating chronic eczema, psoriasis, acne vulgaris, and cosmetic skin disorders.',
        hospitals: ['Asiri Central Hospital', 'Ninewells Hospital', 'Durdans Hospital'],
        avatar: 'https://images.unsplash.com/photo-1594824813580-992a2a7a9224?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Ruwan Wickramasinghe',
        email: 'ruwan.w@medilink.lk',
        phone: '0775566774',
        spec: 'Neurology',
        slmcNo: 'SLMC-16781',
        experienceYears: 20,
        channelingFee: 4000,
        bio: 'Leading Consultant Neurologist specializing in stroke management, epilepsy, Parkinson disease, and neurodegenerative disorders.',
        hospitals: ['Lanka Hospitals', 'Asiri Central Hospital'],
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Chaminda Bandara',
        email: 'chaminda.b@medilink.lk',
        phone: '0776677885',
        spec: 'Pediatrics',
        slmcNo: 'SLMC-24150',
        experienceYears: 9,
        channelingFee: 2500,
        bio: 'Pediatric specialist focused on neonatal care, childhood asthma, growth monitoring, and adolescent health.',
        hospitals: ['Hemas Hospital Wattala', 'Nawaloka Hospital'],
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Shirani Alwis',
        email: 'shirani.a@medilink.lk',
        phone: '0777788996',
        spec: 'Pediatrics',
        slmcNo: 'SLMC-21088',
        experienceYears: 15,
        channelingFee: 3000,
        bio: 'Senior Consultant Pediatrician with 15 years experience in pediatric infectious diseases and developmental assessment.',
        hospitals: ['Ninewells Hospital', 'Lanka Hospitals', 'Kings Hospital Colombo'],
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Rohan Fernando',
        email: 'rohan.f@medilink.lk',
        phone: '0778899007',
        spec: 'Orthopedics',
        slmcNo: 'SLMC-17920',
        experienceYears: 17,
        channelingFee: 3500,
        bio: 'Orthopedic Surgeon specializing in joint replacement, sports injuries, arthroscopic surgery, and spine trauma.',
        hospitals: ['Asiri Surgical Hospital', 'Durdans Hospital'],
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Kanchana Mendis',
        email: 'kanchana.m@medilink.lk',
        phone: '0779900118',
        spec: 'Ophthalmology',
        slmcNo: 'SLMC-23490',
        experienceYears: 11,
        channelingFee: 2600,
        bio: 'Consultant Eye Surgeon specializing in cataract phacoemulsification, glaucoma treatment, and diabetic retinopathy.',
        hospitals: ['Asiri Central Hospital', 'Nawaloka Hospital'],
        avatar: 'https://images.unsplash.com/photo-1594824813580-992a2a7a9224?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Sunethra Ratnayake',
        email: 'sunethra.r@medilink.lk',
        phone: '0711122334',
        spec: 'Obstetrics & Gynecology',
        slmcNo: 'SLMC-15632',
        experienceYears: 22,
        channelingFee: 4200,
        bio: 'Senior Consultant Obstetrician & Gynecologist specializing in high-risk pregnancies, infertility, and laparoscopic surgery.',
        hospitals: ['Ninewells Hospital', 'Lanka Hospitals', 'Durdans Hospital'],
        avatar: 'https://images.unsplash.com/photo-1594824813580-992a2a7a9224?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Lalith Gunasekara',
        email: 'lalith.g@medilink.lk',
        phone: '0712233445',
        spec: 'General Medicine',
        slmcNo: 'SLMC-14210',
        experienceYears: 25,
        channelingFee: 2000,
        bio: 'Experienced Consultant Physician managing complex adult medical cases, diabetes mellitus, and geriatrics.',
        hospitals: ['Asiri Central Hospital', 'Hemas Hospital Wattala', 'Nawaloka Hospital'],
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Niroshan Samaranayake',
        email: 'niroshan.s@medilink.lk',
        phone: '0713344556',
        spec: 'Psychiatry',
        slmcNo: 'SLMC-26804',
        experienceYears: 8,
        channelingFee: 3000,
        bio: 'Consultant Psychiatrist providing compassionate care for depressive disorders, anxiety, stress, and psychotherapy.',
        hospitals: ['Kings Hospital Colombo', 'Asiri Central Hospital'],
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      },
      {
        name: 'Dr. Dinesh Karunaratne',
        email: 'dinesh.k@medilink.lk',
        phone: '0714455667',
        spec: 'ENT (Ear, Nose & Throat)',
        slmcNo: 'SLMC-20194',
        experienceYears: 13,
        channelingFee: 2900,
        bio: 'Consultant ENT Surgeon specializing in sinus surgery, tonsillectomy, hearing restoration, and vertigo management.',
        hospitals: ['Asiri Surgical Hospital', 'Lanka Hospitals'],
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      },
    ];

    const doctorDocs = [];
    for (const d of doctorsData) {
      const user = await User.findOneAndUpdate(
        { email: d.email },
        {
          name: d.name,
          email: d.email,
          passwordHash: doctorPass,
          phone: d.phone,
          role: 'doctor',
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const specId = specMap.get(d.spec);
      const doc = await Doctor.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          specialization: specId,
          slmcNo: d.slmcNo,
          experienceYears: d.experienceYears,
          channelingFee: d.channelingFee,
          bio: d.bio,
          profileImage: d.avatar,
          approvalStatus: 'approved',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      doctorDocs.push({ doctor: doc, hospitalNames: d.hospitals });

      // Create approved DoctorHospital links
      for (const hName of d.hospitals) {
        const hospId = hospitalMap.get(hName);
        if (hospId) {
          await DoctorHospital.findOneAndUpdate(
            { doctor: doc._id, hospital: hospId },
            { doctor: doc._id, hospital: hospId, status: 'approved' },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
    }
    console.log(`  -> 12 approved doctors with hospital affiliations ensured.`);

    console.log('[5/7] Seeding Upcoming Schedules for Next 14 Days...');
    // Clean existing future schedules from previous seed runs for consistency
    const now = new Date();
    await Schedule.deleteMany({ date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } });

    const timeSlots = [
      { start: '08:30', end: '11:30' },
      { start: '14:00', end: '17:00' },
      { start: '17:30', end: '20:30' },
    ];

    const createdSchedules = [];
    let scheduleIndex = 0;

    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + dayOffset);
      scheduleDate.setHours(0, 0, 0, 0);

      // Distribute 4-6 schedules per day across doctors
      for (let i = 0; i < 4; i++) {
        const docEntry = doctorDocs[(scheduleIndex + i) % doctorDocs.length];
        const assignedHospitalName = docEntry.hospitalNames[i % docEntry.hospitalNames.length];
        const hospitalId = hospitalMap.get(assignedHospitalName);
        const slot = timeSlots[(i + dayOffset) % timeSlots.length];

        const isFullyBooked = (dayOffset % 4 === 0 && i === 0); // Some fully booked
        const maxSeats = isFullyBooked ? 10 : 20;
        const initialBooked = isFullyBooked ? 10 : (dayOffset % 3 === 0 ? 5 : 2);

        const schedule = await Schedule.create({
          doctor: docEntry.doctor._id,
          hospital: hospitalId,
          date: scheduleDate,
          startTime: slot.start,
          endTime: slot.end,
          maxPatients: maxSeats,
          bookedCount: initialBooked,
          lastAppointmentNo: initialBooked,
          status: 'active',
        });

        createdSchedules.push({ schedule, initialBooked, doctor: docEntry.doctor });
      }
      scheduleIndex += 2;
    }
    console.log(`  -> ${createdSchedules.length} upcoming schedules seeded across 14 days.`);

    console.log('[6/7] Seeding Sample Appointments for Demo Patients...');
    // Clear old test appointments/payments
    await Appointment.deleteMany({});
    await Payment.deleteMany({});

    // Book first demo patient on schedule 0
    if (createdSchedules.length > 0) {
      const sample1 = createdSchedules[0];
      const appt1 = await Appointment.create({
        patient: patient1._id,
        schedule: sample1.schedule._id,
        appointmentNo: 1,
        status: 'booked',
        patientNote: 'Experiencing mild palpitations after routine exercise.',
      });
      await Payment.create({
        appointment: appt1._id,
        amount: 3500,
        method: 'card_simulated',
        status: 'paid',
        transactionRef: 'TXN-INIT-001',
      });

      // Book second demo patient on schedule 1
      const sample2 = createdSchedules[1];
      const appt2 = await Appointment.create({
        patient: patient2._id,
        schedule: sample2.schedule._id,
        appointmentNo: 1,
        status: 'booked',
        patientNote: 'Follow-up consultation for prescribed skin treatment.',
      });
      await Payment.create({
        appointment: appt2._id,
        amount: 3200,
        method: 'card_simulated',
        status: 'paid',
        transactionRef: 'TXN-INIT-002',
      });
    }
    console.log('  -> Demo appointments and simulated payments created.');

    console.log('\n[7/7] Seed Completed Successfully!\n');
    console.log('======================================================');
    console.log('   DEVELOPMENT DEMO CREDENTIALS (FOR TESTING ONLY)    ');
    console.log('======================================================');
    console.log(`Platform Admin:`);
    console.log(`  Email:    ${config.seed.adminEmail}`);
    console.log(`  Password: ${config.seed.adminPassword}`);
    console.log(`\nHospital Admin (Asiri Central Hospital):`);
    console.log(`  Email:    hospital.admin@medilink.lk`);
    console.log(`  Password: HospAdmin@123`);
    console.log(`\nDoctors (Password for all: Doctor@123):`);
    console.log(`  1. Dr. Anura Senanayake (Cardiology): anura.senanayake@medilink.lk`);
    console.log(`  2. Dr. Malini Jayawardena (Dermatology): malini.j@medilink.lk`);
    console.log(`  3. Dr. Ruwan Wickramasinghe (Neurology): ruwan.w@medilink.lk`);
    console.log(`\nPatients (Password for both: Patient@123):`);
    console.log(`  1. Kasun Perera:  patient1@medilink.lk`);
    console.log(`  2. Nimali Silva:  patient2@medilink.lk`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Seed Error:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

// Execute if run directly
seedData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export default seedData;
