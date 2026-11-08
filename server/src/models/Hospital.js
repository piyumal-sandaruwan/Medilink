import mongoose from 'mongoose';

export const HOSPITAL_TYPES = ['hospital', 'channeling_centre'];

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      index: true,
    },
    registrationNo: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: HOSPITAL_TYPES,
        message: '{VALUE} is not a valid hospital type',
      },
      default: 'hospital',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    image: {
      type: String,
      default: null, // S3 key
    },
    isActive: {
      type: Boolean,
      default: true,
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

export const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
