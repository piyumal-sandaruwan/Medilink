import mongoose from 'mongoose';

export const AFFILIATION_STATUSES = ['pending', 'approved', 'rejected'];

const doctorHospitalSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: AFFILIATION_STATUSES,
        message: '{VALUE} is not a valid affiliation status',
      },
      default: 'pending',
      index: true,
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

// Enforce unique affiliation per doctor-hospital pair
doctorHospitalSchema.index({ doctor: 1, hospital: 1 }, { unique: true });

export const DoctorHospital = mongoose.model('DoctorHospital', doctorHospitalSchema);
export default DoctorHospital;
