import Specialization from '../models/Specialization.js';
import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';
import DoctorHospital from '../models/DoctorHospital.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveImageUrl } from '../services/s3Service.js';

/**
 * Public: Get all active specializations
 */
export const getSpecializations = async (req, res, next) => {
  try {
    const specializations = await Specialization.find().sort({ name: 1 });
    return successResponse(res, { data: specializations });
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Get all active hospitals
 */
export const getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({ isActive: true }).sort({ name: 1 });
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

/**
 * Public: Search approved doctors with rich filters and pagination
 */
export const getDoctors = async (req, res, next) => {
  try {
    const {
      specialization,
      hospital,
      name,
      city,
      date,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Base filter: Doctor must be approved (Business Rule 1)
    const doctorQuery = { approvalStatus: 'approved' };

    // Filter by Specialization (ID or name)
    if (specialization) {
      if (specialization.match(/^[0-9a-fA-F]{24}$/)) {
        doctorQuery.specialization = specialization;
      } else {
        const specDoc = await Specialization.findOne({
          name: { $regex: new RegExp(`^${specialization}$`, 'i') },
        });
        if (specDoc) {
          doctorQuery.specialization = specDoc._id;
        } else {
          // Specialization not found, return empty results
          return successResponse(res, {
            data: {
              doctors: [],
              pagination: { total: 0, page: pageNum, pages: 0, limit: limitNum },
            },
          });
        }
      }
    }

    // Filter by Hospital Affiliation
    if (hospital) {
      const affiliatedDoctorLinks = await DoctorHospital.find({
        hospital,
        status: 'approved',
      }).select('doctor');
      const doctorIds = affiliatedDoctorLinks.map((l) => l.doctor);
      doctorQuery._id = { $in: doctorIds };
    }

    // Filter by Hospital City
    if (city && !hospital) {
      const cityHospitals = await Hospital.find({
        city: { $regex: new RegExp(city, 'i') },
        isActive: true,
      }).select('_id');
      const affiliated = await DoctorHospital.find({
        hospital: { $in: cityHospitals.map((h) => h._id) },
        status: 'approved',
      }).select('doctor');

      const cityDoctorIds = affiliated.map((l) => l.doctor);
      if (doctorQuery._id) {
        // Intersect
        const existing = doctorQuery._id.$in;
        doctorQuery._id = { $in: existing.filter((id) => cityDoctorIds.some((cid) => cid.equals(id))) };
      } else {
        doctorQuery._id = { $in: cityDoctorIds };
      }
    }

    // Filter by Schedule Date
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const scheduledDoctorIds = await Schedule.distinct('doctor', {
        date: { $gte: targetDate, $lt: nextDay },
        status: 'active',
      });

      if (doctorQuery._id) {
        const existing = doctorQuery._id.$in;
        doctorQuery._id = { $in: existing.filter((id) => scheduledDoctorIds.some((sid) => sid.equals(id))) };
      } else {
        doctorQuery._id = { $in: scheduledDoctorIds };
      }
    }

    // Filter by Doctor Name
    let matchingUserIds = null;
    if (name) {
      const users = await User.find({
        name: { $regex: new RegExp(name, 'i') },
        role: 'doctor',
      }).select('_id');
      matchingUserIds = users.map((u) => u._id);
      doctorQuery.user = { $in: matchingUserIds };
    }

    const total = await Doctor.countDocuments(doctorQuery);
    const doctors = await Doctor.find(doctorQuery)
      .populate('user', 'name email phone')
      .populate('specialization', 'name')
      .sort({ experienceYears: -1 })
      .skip(skip)
      .limit(limitNum);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Format output with signed URLs and next available session info
    const formattedDoctors = await Promise.all(
      doctors.map(async (doc) => {
        const item = doc.toObject();
        item.profileImageUrl = await resolveImageUrl(item.profileImage);

        // Find next upcoming active schedule with available seats
        const nextSchedule = await Schedule.findOne({
          doctor: doc._id,
          date: { $gte: today },
          status: 'active',
          $expr: { $lt: ['$bookedCount', '$maxPatients'] },
        })
          .populate('hospital', 'name city')
          .sort({ date: 1, startTime: 1 });

        item.nextSchedule = nextSchedule || null;

        // Fetch affiliated hospitals summary
        const affiliations = await DoctorHospital.find({
          doctor: doc._id,
          status: 'approved',
        }).populate('hospital', 'name city');
        item.hospitals = affiliations.map((a) => a.hospital).filter(Boolean);

        return item;
      })
    );

    return successResponse(res, {
      data: {
        doctors: formattedDoctors,
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
 * Public: Get single doctor profile with upcoming active schedules
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === 'me') {
      return next();
    }

    const doctor = await Doctor.findById(id)
      .populate('user', 'name email phone')
      .populate('specialization', 'name');

    if (!doctor) {
      return next(new AppError('Doctor not found', 404));
    }

    // Business Rule 1: Public profile only accessible if approved
    if (doctor.approvalStatus !== 'approved') {
      return next(new AppError('Doctor profile is not publicly available.', 404));
    }

    const doctorObj = doctor.toObject();
    doctorObj.profileImageUrl = await resolveImageUrl(doctor.profileImage);

    // Affiliated hospitals
    const affiliations = await DoctorHospital.find({
      doctor: doctor._id,
      status: 'approved',
    }).populate('hospital');

    doctorObj.hospitals = affiliations.map((a) => a.hospital).filter(Boolean);

    // Upcoming active schedules with seats left
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingSchedules = await Schedule.find({
      doctor: doctor._id,
      date: { $gte: today },
      status: 'active',
    })
      .populate('hospital', 'name address city phone image')
      .sort({ date: 1, startTime: 1 });

    doctorObj.upcomingSchedules = upcomingSchedules;

    return successResponse(res, { data: doctorObj });
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Get filtered upcoming schedules
 */
export const getSchedules = async (req, res, next) => {
  try {
    const { doctorId, hospitalId, date, specializationId } = req.query;
    const filter = { status: 'active' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: d, $lt: nextDay };
    } else {
      filter.date = { $gte: today };
    }

    if (doctorId) filter.doctor = doctorId;
    if (hospitalId) filter.hospital = hospitalId;

    if (specializationId) {
      const doctorsInSpec = await Doctor.find({
        specialization: specializationId,
        approvalStatus: 'approved',
      }).select('_id');
      filter.doctor = { $in: doctorsInSpec.map((d) => d._id) };
    }

    const schedules = await Schedule.find(filter)
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialization', select: 'name' },
        ],
      })
      .populate('hospital', 'name city address')
      .sort({ date: 1, startTime: 1 })
      .limit(100);

    return successResponse(res, { data: schedules });
  } catch (err) {
    next(err);
  }
};

export default {
  getSpecializations,
  getHospitals,
  getDoctors,
  getDoctorById,
  getSchedules,
};
