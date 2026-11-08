import DoctorHospital from '../models/DoctorHospital.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveImageUrl } from '../services/s3Service.js';

/**
 * Get doctor-hospital affiliations scoped by role
 */
export const getAffiliations = async (req, res, next) => {
  try {
    const filter = {};

    // Hospital admin scope: only their assigned hospital
    if (req.user.role === 'hospital_admin') {
      if (!req.user.hospital) {
        return next(new AppError('No hospital assigned to this hospital administrator.', 400));
      }
      filter.hospital = req.user.hospital;
    }

    const { status } = req.query;
    if (status) {
      filter.status = status;
    }

    const affiliations = await DoctorHospital.find(filter)
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'specialization', select: 'name' },
        ],
      })
      .populate('hospital', 'name registrationNo city address phone')
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      affiliations.map(async (a) => {
        const obj = a.toObject();
        if (obj.doctor && obj.doctor.profileImage) {
          obj.doctor.profileImageUrl = await resolveImageUrl(obj.doctor.profileImage);
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
 * Update affiliation status (approve or reject)
 */
export const updateAffiliationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return next(new AppError("Status must be either 'approved' or 'rejected'.", 400));
    }

    const affiliation = await DoctorHospital.findById(id).populate('hospital', 'name');
    if (!affiliation) {
      return next(new AppError('Doctor-hospital affiliation not found.', 404));
    }

    // Role-based scope check: hospital_admin can only modify their own hospital's requests
    if (req.user.role === 'hospital_admin') {
      if (!req.user.hospital || !affiliation.hospital._id.equals(req.user.hospital)) {
        return next(
          new AppError('Forbidden: You can only approve or reject affiliations for your own hospital.', 403)
        );
      }
    }

    affiliation.status = status;
    await affiliation.save();

    return successResponse(res, {
      message: `Affiliation request has been ${status}.`,
      data: affiliation,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAffiliations,
  updateAffiliationStatus,
};
