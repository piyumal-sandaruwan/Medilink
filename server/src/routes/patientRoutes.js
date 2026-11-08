import express from 'express';
import {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  payAppointment,
} from '../controllers/patientController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { startPayHereCheckout, getPayHerePaymentStatus, handlePayHereNotification } from '../controllers/payhereController.js';

const router = express.Router();

const patientAuth = [authenticate, requireRole('patient')];

// PayHere server-to-server callback: intentionally public; authenticity is verified by md5sig.
router.post('/payments/payhere/notify', handlePayHereNotification);

router.post('/appointments', patientAuth, bookAppointment);
router.get('/appointments/mine', patientAuth, getMyAppointments);
router.patch('/appointments/:id/cancel', patientAuth, cancelAppointment);
router.post('/payments/:appointmentId/pay', patientAuth, payAppointment); // legacy demo endpoint
router.post('/payments/:appointmentId/payhere/checkout', patientAuth, startPayHereCheckout);
router.get('/payments/:appointmentId/status', patientAuth, getPayHerePaymentStatus);

export default router;
