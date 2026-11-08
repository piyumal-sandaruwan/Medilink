import { verifyToken } from '../utils/auth.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to authenticate requests via JWT Bearer token.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please provide a Bearer token.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Malformed authorization header.', 401));
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('The user associated with this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    req.user = user;

    // Attach doctor profile if user is a doctor
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: user._id }).populate('specialization');
      req.doctor = doctorProfile;
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-based access control middleware.
 * @param  {...string} allowedRoles - List of permitted roles ('patient', 'doctor', 'hospital_admin', 'admin')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

export default {
  authenticate,
  requireRole,
};
