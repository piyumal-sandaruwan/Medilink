import Schedule from '../models/Schedule.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Doctor from '../models/Doctor.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { canCancelBooking, combineDateAndTime } from '../utils/timeUtils.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';
import { resolveImageUrl } from '../services/s3Service.js';

/**
 * Patient: Atomic, race-safe appointment booking
 * Business Rule 4: Single findOneAndUpdate with compensation on failure
 * Business Rule 5: One active booking per patient per schedule
 */
export const bookAppointment = async (req, res, next) => {
  const { scheduleId, patientNote } = req.body;

  if (!scheduleId) {
    return next(new AppError('Schedule ID is required.', 400));
  }

  // Pre-check: Friendly error if patient already has an active booking on this schedule
  const existingActiveBooking = await Appointment.findOne({
    patient: req.user._id,
    schedule: scheduleId,
    status: 'booked',
  });

  if (existingActiveBooking) {
    return next(
      new AppError('You already have an active booking for this channeling schedule.', 409)
    );
  }

  // Verify schedule exists and session is in the future
  const targetSchedule = await Schedule.findById(scheduleId);
  if (!targetSchedule) {
    return next(new AppError('Channeling schedule not found.', 404));
  }

  if (targetSchedule.status !== 'active') {
    return next(new AppError('This channeling schedule is no longer active.', 400));
  }

  const sessionStart = combineDateAndTime(targetSchedule.date, targetSchedule.startTime);
  if (new Date() >= sessionStart) {
    return next(new AppError('This channeling session has already started or concluded.', 400));
  }

  // Atomic race-safe seat reservation using findOneAndUpdate
  // Increments bookedCount and lastAppointmentNo ONLY if bookedCount < maxPatients
  const updatedSchedule = await Schedule.findOneAndUpdate(
    {
      _id: scheduleId,
      status: 'active',
      // Re-check capacity and session start in the same atomic write.
      $expr: {
        $and: [
          { $lt: ['$bookedCount', '$maxPatients'] },
          {
            $gt: [
              {
                $dateFromString: {
                  dateString: {
                    $concat: [
                      { $dateToString: { date: '$date', format: '%Y-%m-%d', timezone: 'Asia/Colombo' } },
                      'T',
                      '$startTime',
                      ':00',
                    ],
                  },
                  timezone: 'Asia/Colombo',
                },
              },
              '$$NOW',
            ],
          },
        ],
      },
    },
    {
      $inc: { bookedCount: 1, lastAppointmentNo: 1 },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedSchedule) {
    return next(
      new AppError('This channeling session is currently fully booked. No seats available.', 409)
    );
  }

  const appointmentNo = updatedSchedule.lastAppointmentNo;

  try {
    // Create Appointment record
    const appointment = await Appointment.create({
      patient: req.user._id,
      schedule: scheduleId,
      appointmentNo,
      status: 'booked',
      patientNote: (patientNote || '').trim(),
    });

    // Fetch doctor's fee for payment creation
    const doctor = await Doctor.findById(updatedSchedule.doctor);
    const amount = doctor ? doctor.channelingFee : 2500;

    // Create pending Payment record
    const payment = await Payment.create({
      appointment: appointment._id,
      amount,
      method: 'payhere',
      status: 'pending',
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate({
        path: 'schedule',
        populate: [
          {
            path: 'doctor',
            populate: [
              { path: 'user', select: 'name' },
              { path: 'specialization', select: 'name' },
            ],
          },
          { path: 'hospital', select: 'name city address phone' },
        ],
      });

    return successResponse(res, {
      statusCode: 201,
      message: `Appointment #${appointmentNo} reserved successfully. Please complete simulated payment.`,
      data: {
        appointment: populatedAppointment,
        payment,
        schedule: updatedSchedule,
      },
    });
  } catch (err) {
    // Compensation: Decrement bookedCount if appointment creation fails
    // Note: lastAppointmentNo is not decremented to ensure appointment numbers are never reused
    await Schedule.findByIdAndUpdate(scheduleId, {
      $inc: { bookedCount: -1 },
    });

    return next(err);
  }
};

/**
 * Patient: Get own appointments (upcoming and past)
 */
export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate({
        path: 'schedule',
        populate: [
          {
            path: 'doctor',
            populate: [
              { path: 'user', select: 'name email phone' },
              { path: 'specialization', select: 'name' },
            ],
          },
          { path: 'hospital', select: 'name city address phone image' },
        ],
      })
      .sort({ createdAt: -1 });

    // Fetch payment information for each appointment
    const formatted = await Promise.all(
      appointments.map(async (appt) => {
        const item = appt.toObject();
        const payment = await Payment.findOne({ appointment: appt._id });
        item.payment = payment || null;

        if (item.schedule?.doctor?.profileImage) {
          item.schedule.doctor.profileImageUrl = await resolveImageUrl(
            item.schedule.doctor.profileImage
          );
        }
        return item;
      })
    );

    return successResponse(res, { data: formatted });
  } catch (err) {
    next(err);
  }
};

/**
 * Patient: Cancel own appointment
 * Business Rule 6: Can cancel up to 2 hours before session start.
 * Decrements schedule bookedCount. Numbers are never reused.
 */
export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id).populate('schedule');
    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    // Ownership check: must belong to requesting patient
    if (!appointment.patient.equals(req.user._id)) {
      return next(new AppError('Forbidden: You can only cancel your own appointments.', 403));
    }

    if (appointment.status !== 'booked') {
      return next(
        new AppError(`Cannot cancel an appointment that is already ${appointment.status}.`, 400)
      );
    }

    // Business Rule 6: Up to 2 hours before session start
    const { date, startTime } = appointment.schedule;
    const isAllowed = canCancelBooking(date, startTime, 2);

    if (!isAllowed) {
      return next(
        new AppError(
          'Cancellation window closed. Bookings can only be cancelled up to 2 hours before session start time.',
          400
        )
      );
    }

    // Atomically transition only a still-booked appointment. This prevents two
    // concurrent cancellation requests from releasing the same seat twice.
    const cancelledAppointment = await Appointment.findOneAndUpdate(
      { _id: appointment._id, patient: req.user._id, status: 'booked' },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: req.user._id,
          cancelledAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!cancelledAppointment) {
      return next(new AppError('This appointment has already been cancelled or updated.', 409));
    }

    // Only the request that wins the atomic transition releases the seat.
    await Schedule.findOneAndUpdate(
      { _id: appointment.schedule._id, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 } }
    );

    // Preserve the existing demo behaviour. A real gateway must confirm refunds
    // through its signed callback before a payment can be marked as refunded.
    const payment = await Payment.findOne({ appointment: appointment._id });
    if (payment && payment.status === 'paid' && payment.method === 'card_simulated') {
      payment.status = 'refunded';
      await payment.save();
    }

    return successResponse(res, {
      message: payment?.status === 'paid' && payment?.method === 'payhere'
        ? `Appointment #${appointment.appointmentNo} has been cancelled. Your PayHere payment has not been automatically refunded; please contact MediLink support for refund processing.`
        : `Appointment #${appointment.appointmentNo} has been cancelled successfully.`,
      data: {
        appointment: cancelledAppointment,
        payment,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Patient: Simulated payment
 * Business Rule 9: Marks Payment as paid with transactionRef, sends confirmation email if SMTP configured
 */
export const payAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId).populate({
      path: 'schedule',
      populate: [
        {
          path: 'doctor',
          populate: [
            { path: 'user', select: 'name' },
            { path: 'specialization', select: 'name' },
          ],
        },
        { path: 'hospital', select: 'name address' },
      ],
    });

    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    // Ownership check
    if (!appointment.patient.equals(req.user._id)) {
      return next(new AppError('Forbidden: You can only pay for your own appointments.', 403));
    }

    if (appointment.status !== 'booked') {
      return next(new AppError(`Cannot pay for an appointment that is ${appointment.status}.`, 400));
    }

    let payment = await Payment.findOne({ appointment: appointment._id });
    if (!payment) {
      // Repair legacy/missing payment rows before attempting the atomic transition.
      payment = await Payment.create({
        appointment: appointment._id,
        amount: appointment.schedule.doctor?.channelingFee || 2500,
        method: 'card_simulated',
        status: 'pending',
      });
    }

    if (payment.status === 'paid') {
      return next(new AppError('This appointment has already been paid for.', 400));
    }

    // Generate realistic transaction reference
    const transactionRef = `TXN-MLK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Atomic pending -> paid transition prevents duplicate payment requests
    // from generating multiple successful transactions for one appointment.
    const paidPayment = await Payment.findOneAndUpdate(
      { _id: payment._id, status: 'pending' },
      {
        $set: {
          status: 'paid',
          method: 'card_simulated',
          transactionRef,
        },
      },
      { new: true, runValidators: true }
    );

    if (!paidPayment) {
      return next(new AppError('This appointment payment has already been processed.', 409));
    }
    payment = paidPayment;

    // Fire confirmation email asynchronously (does not crash if SMTP is not configured)
    sendBookingConfirmationEmail({
      patientEmail: req.user.email,
      patientName: req.user.name,
      appointmentNo: appointment.appointmentNo,
      doctorName: appointment.schedule?.doctor?.user?.name || 'Specialist',
      specialization: appointment.schedule?.doctor?.specialization?.name || 'General',
      hospitalName: appointment.schedule?.hospital?.name || 'Hospital',
      hospitalAddress: appointment.schedule?.hospital?.address || 'Colombo',
      date: appointment.schedule.date,
      startTime: appointment.schedule.startTime,
      amount: payment.amount,
      transactionRef,
    }).catch((err) => console.error('Confirmation email error:', err));

    return successResponse(res, {
      message: 'Simulated payment completed successfully. Your booking is confirmed!',
      data: {
        payment,
        appointment,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  payAppointment,
};
