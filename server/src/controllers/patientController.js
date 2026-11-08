
import Schedule from '../models/Schedule.js';
import Appointment from '../models/Appointment.js';
import Payment, {
  DEFAULT_PLATFORM_FEE_RATE,
} from '../models/Payment.js';
import Doctor from '../models/Doctor.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  canCancelBooking,
  combineDateAndTime,
} from '../utils/timeUtils.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';
import { resolveImageUrl } from '../services/s3Service.js';

/**
 * Calculate the patient payment breakdown.
 *
 * Doctor Consultation Fee: Rs. 2,000
 * MediLink Fee (5%): Rs. 100
 * Patient Total: Rs. 2,100
 *
 * Hospital facility fees are not included.
 */
const calculatePaymentBreakdown = (consultationFee) => {
  const fee = Number(consultationFee);

  if (!Number.isFinite(fee) || fee <= 0) {
    throw new AppError('Valid doctor consultation fee is not available.', 400);
  }

  const platformFeeRate = DEFAULT_PLATFORM_FEE_RATE;

  const platformFee = Number(
    ((fee * platformFeeRate) / 100).toFixed(2)
  );

  const amount = Number(
    (fee + platformFee).toFixed(2)
  );

  return {
    consultationFee: fee,
    platformFeeRate,
    platformFee,
    amount,
  };
};

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

  try {
    // Pre-check: Friendly error if patient already has an active booking
    const existingActiveBooking = await Appointment.findOne({
      patient: req.user._id,
      schedule: scheduleId,
      status: 'booked',
    });

    if (existingActiveBooking) {
      return next(
        new AppError(
          'You already have an active booking for this channeling schedule.',
          409
        )
      );
    }

    // Verify schedule exists
    const targetSchedule = await Schedule.findById(scheduleId);

    if (!targetSchedule) {
      return next(new AppError('Channeling schedule not found.', 404));
    }

    if (targetSchedule.status !== 'active') {
      return next(
        new AppError('This channeling schedule is no longer active.', 400)
      );
    }

    const sessionStart = combineDateAndTime(
      targetSchedule.date,
      targetSchedule.startTime
    );

    if (new Date() >= sessionStart) {
      return next(
        new AppError(
          'This channeling session has already started or concluded.',
          400
        )
      );
    }

    // Get doctor's consultation fee before reserving a seat
    const doctor = await Doctor.findById(targetSchedule.doctor);

    if (!doctor) {
      return next(new AppError('Doctor not found.', 404));
    }

    const paymentBreakdown = calculatePaymentBreakdown(
      doctor.channelingFee
    );

    // Atomic race-safe seat reservation
    const updatedSchedule = await Schedule.findOneAndUpdate(
      {
        _id: scheduleId,
        status: 'active',
        $expr: {
          $and: [
            { $lt: ['$bookedCount', '$maxPatients'] },
            {
              $gt: [
                {
                  $dateFromString: {
                    dateString: {
                      $concat: [
                        {
                          $dateToString: {
                            date: '$date',
                            format: '%Y-%m-%d',
                            timezone: 'Asia/Colombo',
                          },
                        },
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
        $inc: {
          bookedCount: 1,
          lastAppointmentNo: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSchedule) {
      return next(
        new AppError(
          'This channeling session is currently fully booked. No seats available.',
          409
        )
      );
    }

    const appointmentNo = updatedSchedule.lastAppointmentNo;

    let appointment;

    try {
      // Create Appointment record
      appointment = await Appointment.create({
        patient: req.user._id,
        schedule: scheduleId,
        appointmentNo,
        status: 'booked',
        patientNote: (patientNote || '').trim(),
      });

      // Create pending Payment record with MediLink commission
      const payment = await Payment.create({
        appointment: appointment._id,
        ...paymentBreakdown,
        method: 'payhere',
        status: 'pending',
      });

      const populatedAppointment = await Appointment.findById(
        appointment._id
      )
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
            {
              path: 'hospital',
              select: 'name city address phone',
            },
          ],
        });

      return successResponse(res, {
        statusCode: 201,
        message: `Appointment #${appointmentNo} reserved successfully. Please complete payment.`,
        data: {
          appointment: populatedAppointment,
          payment,
          schedule: updatedSchedule,
        },
      });
    } catch (err) {
      // Compensation if appointment or payment creation fails
      if (appointment) {
        await Payment.deleteOne({
          appointment: appointment._id,
        });

        await Appointment.deleteOne({
          _id: appointment._id,
        });
      }

      await Schedule.findByIdAndUpdate(scheduleId, {
        $inc: { bookedCount: -1 },
      });

      throw err;
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * Patient: Get own appointments (upcoming and past)
 */
export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
    })
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
          {
            path: 'hospital',
            select: 'name city address phone image',
          },
        ],
      })
      .sort({ createdAt: -1 });

    // Fetch payment information for each appointment
    const formatted = await Promise.all(
      appointments.map(async (appt) => {
        const item = appt.toObject();

        const payment = await Payment.findOne({
          appointment: appt._id,
        });

        item.payment = payment || null;

        if (item.schedule?.doctor?.profileImage) {
          item.schedule.doctor.profileImageUrl = await resolveImageUrl(
            item.schedule.doctor.profileImage
          );
        }

        return item;
      })
    );

    return successResponse(res, {
      data: formatted,
    });
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

    // Ownership check
    if (!appointment.patient.equals(req.user._id)) {
      return next(
        new AppError(
          'Forbidden: You can only cancel your own appointments.',
          403
        )
      );
    }

    if (appointment.status !== 'booked') {
      return next(
        new AppError(
          `Cannot cancel an appointment that is already ${appointment.status}.`,
          400
        )
      );
    }

    // Cancellation allowed up to 2 hours before session start
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

    // Atomic appointment cancellation
    const cancelledAppointment = await Appointment.findOneAndUpdate(
      {
        _id: appointment._id,
        patient: req.user._id,
        status: 'booked',
      },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: req.user._id,
          cancelledAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!cancelledAppointment) {
      return next(
        new AppError(
          'This appointment has already been cancelled or updated.',
          409
        )
      );
    }

    // Release reserved seat
    await Schedule.findOneAndUpdate(
      {
        _id: appointment.schedule._id,
        bookedCount: { $gt: 0 },
      },
      {
        $inc: { bookedCount: -1 },
      }
    );

    // Preserve existing simulated payment behaviour.
    // Real PayHere refunds must be confirmed through a verified gateway process.
    const payment = await Payment.findOne({
      appointment: appointment._id,
    });

    if (
      payment &&
      payment.status === 'paid' &&
      payment.method === 'card_simulated'
    ) {
      payment.status = 'refunded';
      await payment.save();
    }

    return successResponse(res, {
      message:
        payment?.status === 'paid' && payment?.method === 'payhere'
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
 * Marks Payment as paid with transactionRef.
 * Sends confirmation email if SMTP is configured.
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
        {
          path: 'hospital',
          select: 'name address',
        },
      ],
    });

    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    // Ownership check
    if (!appointment.patient.equals(req.user._id)) {
      return next(
        new AppError(
          'Forbidden: You can only pay for your own appointments.',
          403
        )
      );
    }

    if (appointment.status !== 'booked') {
      return next(
        new AppError(
          `Cannot pay for an appointment that is ${appointment.status}.`,
          400
        )
      );
    }

    let payment = await Payment.findOne({
      appointment: appointment._id,
    });

    if (payment?.status === 'paid') {
      return next(
        new AppError('This appointment has already been paid for.', 400)
      );
    }

    // Repair missing or legacy pending payment records
    if (!payment) {
      const paymentBreakdown = calculatePaymentBreakdown(
        appointment.schedule.doctor?.channelingFee
      );

      payment = await Payment.create({
        appointment: appointment._id,
        ...paymentBreakdown,
        method: 'card_simulated',
        status: 'pending',
      });
    } else if (
      payment.consultationFee == null ||
      payment.platformFeeRate == null ||
      payment.platformFee == null
    ) {
      // Existing records created before the commission model
      const paymentBreakdown = calculatePaymentBreakdown(
        appointment.schedule.doctor?.channelingFee
      );

      payment.consultationFee = paymentBreakdown.consultationFee;
      payment.platformFeeRate = paymentBreakdown.platformFeeRate;
      payment.platformFee = paymentBreakdown.platformFee;
      payment.amount = paymentBreakdown.amount;

      await payment.save();
    }

    if (payment.status !== 'pending') {
      return next(
        new AppError(
          `This payment cannot be processed because its status is ${payment.status}.`,
          400
        )
      );
    }

    // Generate transaction reference
    const transactionRef = `TXN-MLK-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // Atomic pending -> paid transition
    const paidPayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: 'pending',
      },
      {
        $set: {
          status: 'paid',
          method: 'card_simulated',
          transactionRef,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!paidPayment) {
      return next(
        new AppError(
          'This appointment payment has already been processed.',
          409
        )
      );
    }

    payment = paidPayment;

    // Send confirmation email asynchronously
    sendBookingConfirmationEmail({
      patientEmail: req.user.email,
      patientName: req.user.name,
      appointmentNo: appointment.appointmentNo,
      doctorName: appointment.schedule?.doctor?.user?.name || 'Specialist',
      specialization:
        appointment.schedule?.doctor?.specialization?.name || 'General',
      hospitalName: appointment.schedule?.hospital?.name || 'Hospital',
      hospitalAddress:
        appointment.schedule?.hospital?.address || 'Colombo',
      date: appointment.schedule.date,
      startTime: appointment.schedule.startTime,
      amount: payment.amount,
      transactionRef,
    }).catch((err) =>
      console.error('Confirmation email error:', err)
    );

    return successResponse(res, {
      message:
        'Simulated payment completed successfully. Your booking is confirmed!',
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
