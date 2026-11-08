import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Appointment from '../models/Appointment.js';
import { AppError } from '../middleware/errorHandler.js';
import { successResponse } from '../utils/response.js';
import config from '../config/env.js';
import {
  createPayHereCheckoutFields,
  formatPayHereAmount,
  verifyPayHereNotification,
} from '../services/payhereService.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';

const populateAppointment = (query) => query
  .populate('patient', 'name email phone')
  .populate({
    path: 'schedule',
    populate: [
      { path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialization', select: 'name' }] },
      { path: 'hospital', select: 'name address city' },
    ],
  });

export const startPayHereCheckout = async (req, res, next) => {
  try {
    if (!config.payhere.isConfigured) {
      return next(new AppError('PayHere is not configured. Set PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET and API_PUBLIC_URL.', 503));
    }

    const { appointmentId } = req.params;
    const appointment = await populateAppointment(Appointment.findById(appointmentId));
    if (!appointment) return next(new AppError('Appointment not found.', 404));
    if (!appointment.patient._id.equals(req.user._id)) {
      return next(new AppError('Forbidden: You can only pay for your own appointments.', 403));
    }
    if (appointment.status !== 'booked') {
      return next(new AppError(`Cannot pay for an appointment that is ${appointment.status}.`, 400));
    }

    let payment = await Payment.findOne({ appointment: appointment._id });
    if (!payment) {
      return next(new AppError('Payment record not found for this appointment.', 404));
    }
    if (payment.status === 'paid') return next(new AppError('This appointment has already been paid for.', 409));
    if (payment.status === 'refunded' || payment.status === 'charged_back') {
      return next(new AppError('This payment cannot be retried. Please contact MediLink support.', 409));
    }

    // Generate a fresh order ID for every checkout attempt. Old callbacks remain
    // associated with their original payment record/order and cannot pay a new one.
    // Reuse an existing pending order to avoid creating duplicate active checkouts
    // when a patient refreshes or double-clicks before PayHere responds.
    const orderId = payment.status === 'pending' && payment.orderId
      ? payment.orderId
      : `MLK-${appointment._id}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    payment.orderId = orderId;
    payment.method = 'payhere';
    payment.status = 'pending';
    payment.gatewayStatus = 'checkout_created';
    await payment.save();

    const checkout = createPayHereCheckoutFields({
      payment,
      patient: appointment.patient,
      appointment,
      schedule: appointment.schedule,
    });

    return successResponse(res, {
      message: `PayHere ${config.payhere.sandbox ? 'sandbox' : 'checkout'} session created.`,
      data: { ...checkout, orderId, amount: formatPayHereAmount(payment.amount), sandbox: config.payhere.sandbox },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPayHerePaymentStatus = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId).select('patient');
    if (!appointment) return next(new AppError('Appointment not found.', 404));
    if (!appointment.patient.equals(req.user._id)) {
      return next(new AppError('Forbidden: You can only view your own payment.', 403));
    }
    const payment = await Payment.findOne({ appointment: appointment._id });
    if (!payment) return next(new AppError('Payment record not found.', 404));
    return successResponse(res, { data: { payment } });
  } catch (error) {
    return next(error);
  }
};

export const handlePayHereNotification = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!verifyPayHereNotification(payload)) {
      return res.status(400).send('Invalid PayHere notification signature.');
    }

    const payment = await Payment.findOne({ orderId: String(payload.order_id) });
    if (!payment) return res.status(404).send('Payment order not found.');

    const expectedAmount = formatPayHereAmount(payment.amount);
    const receivedAmount = formatPayHereAmount(Number(payload.payhere_amount));
    if (
      !Number.isFinite(Number(payload.payhere_amount)) ||
      receivedAmount !== expectedAmount ||
      payload.payhere_currency !== 'LKR'
    ) {
      return res.status(400).send('Payment amount or currency mismatch.');
    }

    const statusCode = Number(payload.status_code);
    const gatewayPaymentId = String(payload.payment_id || '');

    // PayHere may retry notifications. Make successful processing idempotent and
    // never let a late failure callback downgrade a previously confirmed payment.
    if (payment.status === 'paid' && statusCode !== -3) {
      return res.status(200).send('Already processed.');
    }

    const update = {
      gatewayPaymentId: gatewayPaymentId || payment.gatewayPaymentId,
      gatewayStatus: String(payload.status_message || payload.status_code),
      gatewayMethod: payload.method || payment.gatewayMethod,
    };
    let relatedAppointment = null;

    if (statusCode === 2) {
      relatedAppointment = await populateAppointment(Appointment.findById(payment.appointment));
      if (relatedAppointment?.status === 'cancelled') {
        update.gatewayStatus = 'paid_after_appointment_cancelled_refund_review';
      }
      update.status = 'paid';
      update.transactionRef = gatewayPaymentId || payment.orderId;
    } else if (statusCode === -1) {
      update.status = 'cancelled';
    } else if (statusCode === -2) {
      update.status = 'failed';
    } else if (statusCode === -3) {
      update.status = 'charged_back';
    } else if (statusCode !== 0) {
      return res.status(400).send('Unsupported PayHere status code.');
    }

    await Payment.findOneAndUpdate(
      { _id: payment._id, orderId: String(payload.order_id) },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (statusCode === 2 && relatedAppointment?.status === 'booked') {
      const appointment = relatedAppointment;
      if (appointment?.patient?.email) {
        sendBookingConfirmationEmail({
          patientEmail: appointment.patient.email,
          patientName: appointment.patient.name,
          appointmentNo: appointment.appointmentNo,
          doctorName: appointment.schedule?.doctor?.user?.name || 'Specialist',
          specialization: appointment.schedule?.doctor?.specialization?.name || 'General',
          hospitalName: appointment.schedule?.hospital?.name || 'Hospital',
          hospitalAddress: appointment.schedule?.hospital?.address || 'Sri Lanka',
          date: appointment.schedule?.date,
          startTime: appointment.schedule?.startTime,
          amount: payment.amount,
          transactionRef: gatewayPaymentId || payment.orderId,
        }).catch((error) => console.error('PayHere confirmation email error:', error));
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notification processing failed:', error);
    return res.status(500).send('Notification processing failed.');
  }
};
