import mongoose from 'mongoose';

export const PAYMENT_METHODS = ['card_simulated', 'payhere', 'cash'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'cancelled', 'refunded', 'charged_back'];

const paymentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    method: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid payment method',
      },
      default: 'card_simulated',
    },
    status: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
      index: true,
    },
    orderId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    gatewayStatus: {
      type: String,
      default: null,
      trim: true,
    },
    gatewayMethod: {
      type: String,
      default: null,
      trim: true,
    },
    transactionRef: {
      type: String,
      default: null,
      trim: true,
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

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
