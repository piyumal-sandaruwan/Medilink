import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerPatient,
  registerDoctor,
  login,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
} from '../validations/authValidation.js';
import config from '../config/env.js';

const router = express.Router();

// Strict rate limiter for auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
});

router.post('/register', authLimiter, validate(registerPatientSchema), registerPatient);
router.post('/register-doctor', authLimiter, validate(registerDoctorSchema), registerDoctor);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
