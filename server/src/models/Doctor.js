import mongoose from 'mongoose';

export const DOCTOR_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    specialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialization',
      required: [true, 'Specialization reference is required'],
      index: true,
    },
    slmcNo: {
      type: String,
      required: [true, 'SLMC registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience years cannot be negative'],
    },
    channelingFee: {
      type: Number,
      required: [true, 'Channeling fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: null, // S3 key
    },
    slmcDocument: {
      type: String,
      default: null, // S3 key
    },
    approvalStatus: {
      type: String,
      enum: {
        values: DOCTOR_APPROVAL_STATUSES,
        message: '{VALUE} is not a valid approval status',
      },
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
