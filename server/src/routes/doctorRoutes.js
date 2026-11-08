import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  requestHospitalAffiliation,
  getMyHospitals,
  createSchedule,
  getMySchedules,
  cancelSchedule,
  getScheduleAppointments,
  completeAppointment,
} from '../controllers/doctorController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Doctor profile and affiliations
router.get('/doctors/me', authenticate, requireRole('doctor'), getMyProfile);
router.put('/doctors/me', authenticate, requireRole('doctor'), updateMyProfile);
router.post('/doctors/me/hospital-requests', authenticate, requireRole('doctor'), requestHospitalAffiliation);
router.get('/doctors/me/hospitals', authenticate, requireRole('doctor'), getMyHospitals);

// Doctor schedules
router.post('/schedules/mine', authenticate, requireRole('doctor'), createSchedule);
router.get('/schedules/mine', authenticate, requireRole('doctor'), getMySchedules);
router.patch('/schedules/:id/cancel', authenticate, requireRole('doctor', 'admin'), cancelSchedule);
router.get('/schedules/:id/appointments', authenticate, requireRole('doctor', 'hospital_admin', 'admin'), getScheduleAppointments);

// Appointment completion
router.patch('/appointments/:id/complete', authenticate, requireRole('doctor', 'admin'), completeAppointment);

export default router;
