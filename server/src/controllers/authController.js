import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Specialization from '../models/Specialization.js';
import Hospital from '../models/Hospital.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveImageUrl } from '../services/s3Service.js';

/**
 * Register a new Patient
 * Role is strictly locked to 'patient'
 */
export const registerPatient = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'patient',
      isActive: true,
    });

    const token = generateToken({ id: user._id, role: user.role });

    return successResponse(res, {
      statusCode: 201,
      message: 'Patient registered successfully',
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Register a new Doctor
 * Creates a doctor User and a pending Doctor profile
 */
export const registerDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      slmcNo,
      experienceYears,
      channelingFee,
      bio,
      profileImage,
      slmcDocument,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    const existingSlmc = await Doctor.findOne({ slmcNo: slmcNo.toUpperCase() });
    if (existingSlmc) {
      return next(new AppError('A doctor with this SLMC registration number already exists.', 409));
    }

    const specExists = await Specialization.findById(specialization);
    if (!specExists) {
      return next(new AppError('Selected specialization does not exist.', 400));
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: 'doctor',
      isActive: true,
    });

    const doctor = await Doctor.create({
      user: user._id,
      specialization,
      slmcNo: slmcNo.toUpperCase(),
      experienceYears,
      channelingFee,
      bio: bio || '',
      profileImage: profileImage || null,
      slmcDocument: slmcDocument || null,
      approvalStatus: 'pending',
    });

    const populatedDoctor = await Doctor.findById(doctor._id).populate('specialization');
    const token = generateToken({ id: user._id, role: user.role });

    return successResponse(res, {
      statusCode: 201,
      message: 'Doctor registered successfully. Your profile is pending verification by the administration.',
      data: {
        token,
        user,
        doctor: populatedDoctor,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * User Login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    const token = generateToken({ id: user._id, role: user.role });

    let doctor = null;
    let hospital = null;

    if (user.role === 'doctor') {
      doctor = await Doctor.findOne({ user: user._id }).populate('specialization');
      if (doctor && doctor.profileImage) {
        doctor = doctor.toObject();
        doctor.profileImageUrl = await resolveImageUrl(doctor.profileImage);
      }
    } else if (user.role === 'hospital_admin' && user.hospital) {
      hospital = await Hospital.findById(user.hospital);
    }

    return successResponse(res, {
      message: 'Logged in successfully',
      data: {
        token,
        user,
        doctor,
        hospital,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let doctor = null;
    let hospital = null;

    if (user.role === 'doctor') {
      doctor = await Doctor.findOne({ user: user._id }).populate('specialization');
      if (doctor && doctor.profileImage) {
        doctor = doctor.toObject();
        doctor.profileImageUrl = await resolveImageUrl(doctor.profileImage);
      }
    } else if (user.role === 'hospital_admin' && user.hospital) {
      hospital = await Hospital.findById(user.hospital);
    }

    return successResponse(res, {
      data: {
        user,
        doctor,
        hospital,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  registerPatient,
  registerDoctor,
  login,
  getMe,
};
