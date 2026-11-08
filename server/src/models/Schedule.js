import mongoose from 'mongoose';

export const SCHEDULE_STATUSES = ['active', 'cancelled', 'completed'];

const scheduleSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Schedule date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24-hour format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24-hour format'],
    },
    maxPatients: {
      type: Number,
      required: [true, 'Maximum patient limit is required'],
      min: [1, 'Maximum patients must be at least 1'],
      max: [100, 'Maximum patients cannot exceed 100'],
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: [0, 'Booked count cannot be negative'],
    },
    lastAppointmentNo: {
      type: Number,
      default: 0,
      min: [0, 'Last appointment number cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: SCHEDULE_STATUSES,
        message: '{VALUE} is not a valid schedule status',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Helpful virtual: remainingSeats
scheduleSchema.virtual('remainingSeats').get(function () {
  return Math.max(0, this.maxPatients - this.bookedCount);
});

// Indexes for high performance querying
scheduleSchema.index({ doctor: 1, date: 1, status: 1 });
scheduleSchema.index({ hospital: 1, date: 1, status: 1 });
scheduleSchema.index({ date: 1, status: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
