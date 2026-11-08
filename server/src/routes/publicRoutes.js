import express from 'express';
import {
  getSpecializations,
  getHospitals,
  getDoctors,
  getDoctorById,
  getSchedules,
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/specializations', getSpecializations);
router.get('/hospitals', getHospitals);
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);
router.get('/schedules', getSchedules);

export default router;
