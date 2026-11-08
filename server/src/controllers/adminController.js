
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import Specialization from '../models/Specialization.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import Schedule from '../models/Schedule.js';
import { hashPassword } from '../utils/auth.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveImageUrl, getPresignedViewUrl } from '../services/s3Service.js';

/**
 * Admin: Get all doctors with approvalStatus filter and pagination
 */
export const getAllDoctors = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.approvalStatus = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Doctor.countDocuments(filter);

    const doctors = await Doctor.find(filter)
      .populate('user', 'name email phone isActive')
      .populate('specialization', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formatted = await Promise.all(
      doctors.map(async (doc) => {
        const item = doc.toObject();

        item.profileImageUrl = await resolveImageUrl(item.profileImage);

        if (item.slmcDocument) {
          item.slmcDocumentUrl = await getPresignedViewUrl(
            item.slmcDocument,
            3600
          );
        }

        return item;
      })
    );

    return successResponse(res, {
      data: {
        doctors: formatted,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Approve or Reject a doctor
 */
export const updateDoctorApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return next(new AppError('Invalid approval status.', 400));
    }

    const doctor = await Doctor.findById(id).populate('user', 'name email');

    if (!doctor) {
      return next(new AppError('Doctor not found.', 404));
    }

    doctor.approvalStatus = approvalStatus;
    doctor.rejectionReason =
      approvalStatus === 'rejected'
        ? rejectionReason || 'Requirements not met'
        : null;

    await doctor.save();

    return successResponse(res, {
      message: `Doctor ${doctor.user?.name} has been ${approvalStatus}.`,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Hospitals CRUD
 */
export const getAdminHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });

    const formatted = await Promise.all(
      hospitals.map(async (h) => {
        const obj = h.toObject();
        obj.imageUrl = await resolveImageUrl(h.image);
        return obj;
      })
    );

    return successResponse(res, { data: formatted });
  } catch (err) {
    next(err);
  }
};

export const createHospital = async (req, res, next) => {
  try {
    const {
      name,
      registrationNo,
      type,
      city,
      address,
      phone,
      image,
    } = req.body;

    const existing = await Hospital.findOne({ registrationNo });

    if (existing) {
      return next(
        new AppError(
          'A hospital with this registration number already exists.',
          409
        )
      );
    }

    const hospital = await Hospital.create({
      name,
      registrationNo,
      type: type || 'hospital',
      city,
      address,
      phone,
      image: image || null,
      isActive: true,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Hospital created successfully',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const updateHospital = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!hospital) {
      return next(new AppError('Hospital not found.', 404));
    }

    return successResponse(res, {
      message: 'Hospital updated successfully',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteHospital = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return next(new AppError('Hospital not found.', 404));
    }

    // Toggle active state instead of hard delete
    hospital.isActive = !hospital.isActive;
    await hospital.save();

    return successResponse(res, {
      message: `Hospital ${
        hospital.isActive ? 'activated' : 'deactivated'
      } successfully`,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Specializations CRUD
 */
export const getAdminSpecializations = async (req, res, next) => {
  try {
    const specializations = await Specialization.find().sort({ name: 1 });

    return successResponse(res, { data: specializations });
  } catch (err) {
    next(err);
  }
};

export const createSpecialization = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return next(
        new AppError('Specialization name is required.', 400)
      );
    }

    const existing = await Specialization.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return next(
        new AppError('Specialization already exists.', 409)
      );
    }

    const spec = await Specialization.create({
      name: name.trim(),
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Specialization created successfully',
      data: spec,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSpecialization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const spec = await Specialization.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!spec) {
      return next(new AppError('Specialization not found.', 404));
    }

    return successResponse(res, {
      message: 'Specialization updated successfully',
      data: spec,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSpecialization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const inUse = await Doctor.findOne({
      specialization: id,
    });

    if (inUse) {
      return next(
        new AppError(
          'Cannot delete specialization: Doctors are registered under it.',
          400
        )
      );
    }

    await Specialization.findByIdAndDelete(id);

    return successResponse(res, {
      message: 'Specialization deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Users Management
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .populate('hospital', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return successResponse(res, {
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    if (user.role === 'admin' && !isActive) {
      return next(
        new AppError(
          'Cannot deactivate the platform administrator.',
          400
        )
      );
    }

    user.isActive = Boolean(isActive);
    await user.save();

    return successResponse(res, {
      message: `User account has been ${
        user.isActive ? 'activated' : 'deactivated'
      }.`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Create hospital_admin account
 */
export const createHospitalAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone, hospital } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(
        new AppError(
          'An account with this email address already exists.',
          409
        )
      );
    }

    const hospitalDoc = await Hospital.findById(hospital);

    if (!hospitalDoc) {
      return next(
        new AppError('Assigned hospital does not exist.', 404)
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'hospital_admin',
      hospital,
      isActive: true,
    });

    const populated = await User.findById(user._id)
      .populate('hospital', 'name city');

    return successResponse(res, {
      statusCode: 201,
      message: 'Hospital administrator account created successfully',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Platform-wide appointments
 */
export const getAllAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Appointment.countDocuments(filter);

    const appointments = await Appointment.find(filter)
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
            select: 'name city',
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return successResponse(res, {
      data: {
        appointments,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Platform analytics & stats
 *
 * Revenue definition:
 * totalRevenue = MediLink platform fees from paid payments only.
 *
 * totalConsultationFees = Doctor consultation fees from paid payments.
 *
 * totalCollected = Total amount collected from patients through payments.
 *
 * Hospital facility charges are excluded because they are paid
 * separately to hospitals.
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalHospitals,
      totalAppointments,
      paidPayments,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments({ approvalStatus: 'approved' }),
      Doctor.countDocuments({ approvalStatus: 'pending' }),
      Hospital.countDocuments({ isActive: true }),
      Appointment.countDocuments(),
      Payment.find({ status: 'paid' }).select(
        'amount consultationFee platformFee'
      ),
    ]);

    // MediLink revenue: platform commission only
    const totalRevenue = paidPayments.reduce(
      (acc, payment) => acc + (Number(payment.platformFee) || 0),
      0
    );

    // Doctor consultation fees
    const totalConsultationFees = paidPayments.reduce(
      (acc, payment) =>
        acc + (Number(payment.consultationFee) || 0),
      0
    );

    // Total online payments collected from patients
    const totalCollected = paidPayments.reduce(
      (acc, payment) => acc + (Number(payment.amount) || 0),
      0
    );

    // 14-day booking trend
    const fourteenDaysAgo = new Date();

    fourteenDaysAgo.setDate(
      fourteenDaysAgo.getDate() - 13
    );

    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const trendAppointments = await Appointment.find({
      createdAt: { $gte: fourteenDaysAgo },
    }).select('createdAt status');

    const trendMap = new Map();

    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);

      d.setDate(d.getDate() + i);

      const dateKey = d.toISOString().split('T')[0];

      trendMap.set(dateKey, 0);
    }

    trendAppointments.forEach((a) => {
      const dateKey = a.createdAt.toISOString().split('T')[0];

      if (trendMap.has(dateKey)) {
        trendMap.set(
          dateKey,
          trendMap.get(dateKey) + 1
        );
      }
    });

    const bookingTrend = Array.from(
      trendMap.entries()
    ).map(([date, count]) => ({
      date,
      bookings: count,
    }));

    // Top Specializations by bookings
    const popularSpecs = await Appointment.aggregate([
      {
        $lookup: {
          from: 'schedules',
          localField: 'schedule',
          foreignField: '_id',
          as: 'schedule',
        },
      },
      { $unwind: '$schedule' },
      {
        $lookup: {
          from: 'doctors',
          localField: 'schedule.doctor',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $lookup: {
          from: 'specializations',
          localField: 'doctor.specialization',
          foreignField: '_id',
          as: 'spec',
        },
      },
      { $unwind: '$spec' },
      {
        $group: {
          _id: '$spec.name',
          bookings: { $sum: 1 },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          bookings: 1,
        },
      },
    ]);

    return successResponse(res, {
      data: {
        totals: {
          totalPatients,
          totalDoctors,
          pendingDoctors,
          totalHospitals,
          totalAppointments,

          // MediLink commission revenue
          totalRevenue,

          // Additional payment metrics
          totalConsultationFees,
          totalCollected,
        },
        bookingTrend,
        topSpecializations: popularSpecs,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
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
};
