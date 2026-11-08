import express from 'express';
import {
  getAffiliations,
  updateAffiliationStatus,
} from '../controllers/affiliationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get(
  '/doctor-hospitals',
  authenticate,
  requireRole('hospital_admin', 'admin'),
  getAffiliations
);

router.patch(
  '/doctor-hospitals/:id',
  authenticate,
  requireRole('hospital_admin', 'admin'),
  updateAffiliationStatus
);

export default router;
