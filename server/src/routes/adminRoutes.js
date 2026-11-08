import express from 'express';
import {
  getAllDoctors,
  updateDoctorApproval,
  getAdminHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  getAdminSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  getUsers,
  updateUserStatus,
  createHospitalAdmin,
  getAllAppointments,
  getAdminStats,
} from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createHospitalAdminSchema } from '../validations/authValidation.js';

const router = express.Router();

// Require admin authentication for all routes in this router
router.use(authenticate, requireRole('admin'));

// Doctor approval
router.get('/doctors', getAllDoctors);
router.patch('/doctors/:id/approval', updateDoctorApproval);

// Hospital CRUD
router.get('/hospitals', getAdminHospitals);
router.post('/hospitals', createHospital);
router.put('/hospitals/:id', updateHospital);
router.delete('/hospitals/:id', deleteHospital);

// Specialization CRUD
router.get('/specializations', getAdminSpecializations);
router.post('/specializations', createSpecialization);
router.put('/specializations/:id', updateSpecialization);
router.delete('/specializations/:id', deleteSpecialization);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.post('/hospital-admins', validate(createHospitalAdminSchema), createHospitalAdmin);

// Appointments & Stats
router.get('/appointments', getAllAppointments);
router.get('/stats', getAdminStats);

export default router;
