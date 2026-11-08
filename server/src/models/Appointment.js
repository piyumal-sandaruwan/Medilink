import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = ['booked', 'completed', 'cancelled'];

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: [true, 'Schedule reference is required'],
      index: true,
    },
    appointmentNo: {
      type: Number,
      required: [true, 'Appointment number is required'],
      min: [1, 'Appointment number must be positive'],
    },
    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: '{VALUE} is not a valid appointment status',
      },
      default: 'booked',
      index: true,
    },
    patientNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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

// Business Rule 5: Enforce that a patient cannot hold two active bookings for the same schedule
appointmentSchema.index(
  { patient: 1, schedule: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'booked' },
  }
);

// High efficiency lookup index
appointmentSchema.index({ schedule: 1, appointmentNo: 1 });
appointmentSchema.index({ patient: 1, status: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
