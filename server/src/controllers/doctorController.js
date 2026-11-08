import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import DoctorHospital from '../models/DoctorHospital.js';
import Schedule from '../models/Schedule.js';
import Appointment from '../models/Appointment.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveImageUrl, getPresignedViewUrl } from '../services/s3Service.js';
import { isTimeOverlap, combineDateAndTime } from '../utils/timeUtils.js';
import { sendScheduleCancellationEmail } from '../services/emailService.js';

/**
 * Get current doctor's profile
 */
export const getMyProfile = async (req, res, next) => {
  try {
    if (!req.doctor) {
      return next(new AppError('Doctor profile not found for this user account.', 404));
    }

    const doctorObj = req.doctor.toObject();
    doctorObj.profileImageUrl = await resolveImageUrl(doctorObj.profileImage);

    // If SLMC document key is present, get signed view URL
    if (doctorObj.slmcDocument) {
      doctorObj.slmcDocumentUrl = await getPresignedViewUrl(doctorObj.slmcDocument, 3600);
    }

    return successResponse(res, { data: doctorObj });
  } catch (err) {
    next(err);
  }
};

/**
 * Update current doctor's profile
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    if (!req.doctor) {
      return next(new AppError('Doctor profile not found.', 404));
    }

    const { bio, channelingFee, profileImage, slmcDocument } = req.body;
    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (channelingFee !== undefined) {
      if (channelingFee < 0) {
        return next(new AppError('Channeling fee cannot be negative.', 400));
      }
      updates.channelingFee = channelingFee;
    }
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (slmcDocument !== undefined) updates.slmcDocument = slmcDocument;

    const updated = await Doctor.findByIdAndUpdate(req.doctor._id, updates, {
      new: true,
      runValidators: true,
    }).populate('specialization');

    const doctorObj = updated.toObject();
    doctorObj.profileImageUrl = await resolveImageUrl(doctorObj.profileImage);
    if (doctorObj.slmcDocument) {
      doctorObj.slmcDocumentUrl = await getPresignedViewUrl(doctorObj.slmcDocument, 3600);
    }

    return successResponse(res, {
      message: 'Profile updated successfully',
      data: doctorObj,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Request affiliation with a hospital
 */
export const requestHospitalAffiliation = async (req, res, next) => {
  try {
    if (!req.doctor) {
      return next(new AppError('Doctor profile not found.', 404));
    }

    const { hospitalId } = req.body;
    if (!hospitalId) {
      return next(new AppError('Hospital ID is required.', 400));
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital || !hospital.isActive) {
      return next(new AppError('Hospital not found or inactive.', 404));
    }

    const existing = await DoctorHospital.findOne({
      doctor: req.doctor._id,
      hospital: hospitalId,
    });

    if (existing) {
      if (existing.status === 'approved') {
        return next(new AppError('You are already affiliated with this hospital.', 409));
      }
      if (existing.status === 'pending') {
        return next(new AppError('An affiliation request for this hospital is already pending approval.', 409));
      }
      // If rejected, re-request
      existing.status = 'pending';
      await existing.save();
      return successResponse(res, {
        message: 'Affiliation request re-submitted for approval.',
        data: existing,
      });
    }

    const newAffiliation = await DoctorHospital.create({
      doctor: req.doctor._id,
      hospital: hospitalId,
      status: 'pending',
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Hospital affiliation request submitted successfully',
      data: newAffiliation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all hospital affiliations for current doctor
 */
export const getMyHospitals = async (req, res, next) => {
  try {
    if (!req.doctor) {
      return next(new AppError('Doctor profile not found.', 404));
    }

    const affiliations = await DoctorHospital.find({ doctor: req.doctor._id })
      .populate('hospital')
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      affiliations.map(async (a) => {
        const obj = a.toObject();
        if (obj.hospital && obj.hospital.image) {
          obj.hospital.imageUrl = await resolveImageUrl(obj.hospital.image);
        }
        return obj;
      })
    );

    return successResponse(res, { data: formatted });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new schedule (session)
 * Strictly enforces Business Rules 1, 2, and 3
 */
export const createSchedule = async (req, res, next) => {
  try {
    if (!req.doctor) {
      return next(new AppError('Doctor profile not found.', 404));
    }

    // Business Rule 1: A doctor can create schedules only when approvalStatus is approved
    if (req.doctor.approvalStatus !== 'approved') {
      return next(
        new AppError('Your doctor account must be approved by an administrator before creating schedules.', 403)
      );
    }

    const { hospitalId, date, startTime, endTime, maxPatients } = req.body;

    // Basic fields validation
    if (!hospitalId || !date || !startTime || !endTime || maxPatients === undefined) {
      return next(new AppError('All schedule fields (hospitalId, date, startTime, endTime, maxPatients) are required.', 400));
    }

    // Business Rule 2: Doctor can create schedule ONLY at a hospital where DoctorHospital link is approved
    const affiliation = await DoctorHospital.findOne({
      doctor: req.doctor._id,
      hospital: hospitalId,
      status: 'approved',
    });

    if (!affiliation) {
      return next(
        new AppError('You can only create schedules at hospitals where your affiliation has been approved.', 403)
      );
    }

    // Business Rule 3 Validation:
    // a. maxPatients between 1 and 100
    const maxSeats = parseInt(maxPatients, 10);
    if (isNaN(maxSeats) || maxSeats < 1 || maxSeats > 100) {
      return next(new AppError('Maximum patients must be a number between 1 and 100.', 400));
    }

    // b. endTime after startTime
    if (startTime >= endTime) {
      return next(new AppError('Session end time must be strictly after start time.', 400));
    }

    // c. date must be in the future
    const scheduleDate = new Date(date);
    const startDateTime = combineDateAndTime(scheduleDate, startTime);
    if (startDateTime <= new Date()) {
      return next(new AppError('Schedule date and start time must be in the future.', 400));
    }

    // Normalize scheduleDate to start of day for clean date grouping
    const normalizedDate = new Date(scheduleDate);
    normalizedDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(normalizedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // d. Doctor cannot have overlapping schedules on the same date, even at different hospitals!
    const existingSameDaySchedules = await Schedule.find({
      doctor: req.doctor._id,
      date: { $gte: normalizedDate, $lt: nextDay },
      status: { $ne: 'cancelled' },
    }).populate('hospital', 'name');

    for (const existing of existingSameDaySchedules) {
      if (isTimeOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
        return next(
          new AppError(
            `Schedule overlap: You already have an active session from ${existing.startTime} to ${existing.endTime} at ${existing.hospital?.name || 'another hospital'} on this date.`,
            400
          )
        );
      }
    }

    const newSchedule = await Schedule.create({
      doctor: req.doctor._id,
      hospital: hospitalId,
      date: normalizedDate,
      startTime,
      endTime,
      maxPatients: maxSeats,
      bookedCount: 0,
      lastAppointmentNo: 0,
      status: 'active',
    });

    const populated = await Schedule.findById(newSchedule._id).populate('hospital', 'name address city');

    return successResponse(res, {
      statusCode: 201,
      message: 'Schedule created successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current doctor's own schedules
 */
export const getMySchedules = async (req, res, next) => {
  try {
    if (!req.doctor) {
      return next(new AppError('Doctor profile not found.', 404));
    }

    const schedules = await Schedule.find({ doctor: req.doctor._id })
      .populate('hospital', 'name city address')
      .sort({ date: -1, startTime: 1 });

    return successResponse(res, { data: schedules });
  } catch (err) {
    next(err);
  }
};

/**
 * Doctor cancels their schedule
 * Business Rule 7: Mark schedule cancelled, cancel all its booked appointments, send email to patients
 */
export const cancelSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id).populate('hospital', 'name');
    if (!schedule) {
      return next(new AppError('Schedule not found.', 404));
    }

    // Ownership check: must be owner doctor or admin
    const isOwner = req.doctor && schedule.doctor.equals(req.doctor._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('Forbidden: You can only cancel your own schedules.', 403));
    }

    if (schedule.status === 'cancelled') {
      return next(new AppError('Schedule is already cancelled.', 400));
    }

    schedule.status = 'cancelled';
    await schedule.save();

    // Find all active booked appointments to cancel and notify
    const activeAppointments = await Appointment.find({
      schedule: schedule._id,
      status: 'booked',
    }).populate('patient', 'name email');

    const now = new Date();
    await Appointment.updateMany(
      { schedule: schedule._id, status: 'booked' },
      { status: 'cancelled', cancelledAt: now, cancelledBy: req.user._id }
    );

    // Fire email notifications to all affected patients (async non-blocking)
    const doctorUser = await Doctor.findById(schedule.doctor).populate('user', 'name');
    const doctorName = doctorUser?.user?.name || 'Doctor';

    for (const appt of activeAppointments) {
      if (appt.patient?.email) {
        sendScheduleCancellationEmail({
          patientEmail: appt.patient.email,
          patientName: appt.patient.name,
          appointmentNo: appt.appointmentNo,
          doctorName,
          hospitalName: schedule.hospital?.name || 'Hospital',
          date: schedule.date,
          startTime: schedule.startTime,
        }).catch((err) => console.error('Email send error:', err));
      }
    }

    return successResponse(res, {
      message: `Schedule cancelled successfully. ${activeAppointments.length} patient appointment(s) were cancelled.`,
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get appointments roster for a specific schedule
 */
export const getScheduleAppointments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return next(new AppError('Schedule not found.', 404));
    }

    // Ownership check: session doctor, admin, or hospital admin of this hospital
    const isOwnerDoctor = req.doctor && schedule.doctor.equals(req.doctor._id);
    const isAdmin = req.user.role === 'admin';
    const isHospitalAdmin =
      req.user.role === 'hospital_admin' && req.user.hospital?.equals(schedule.hospital);

    if (!isOwnerDoctor && !isAdmin && !isHospitalAdmin) {
      return next(new AppError('Forbidden: You do not have permission to view this session roster.', 403));
    }

    const appointments = await Appointment.find({ schedule: id })
      .populate('patient', 'name email phone')
      .sort({ appointmentNo: 1 });

    return successResponse(res, { data: appointments });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark an appointment completed
 * Business Rule 8: Only the doctor of a schedule (or admin) can mark completed
 */
export const completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id).populate('schedule');
    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    const isOwnerDoctor = req.doctor && appointment.schedule.doctor.equals(req.doctor._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerDoctor && !isAdmin) {
      return next(new AppError('Only the consulting doctor or an admin can mark an appointment completed.', 403));
    }

    if (appointment.status !== 'booked') {
      return next(new AppError(`Cannot complete an appointment that is already ${appointment.status}.`, 400));
    }

    appointment.status = 'completed';
    await appointment.save();

    return successResponse(res, {
      message: `Appointment #${appointment.appointmentNo} marked as completed.`,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getMyProfile,
  updateMyProfile,
  requestHospitalAffiliation,
  getMyHospitals,
  createSchedule,
  getMySchedules,
  cancelSchedule,
  getScheduleAppointments,
  completeAppointment,
};
