import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: [true, 'Fee structure reference is required']
    },
    amountPaid: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be greater than zero']
    },
    lateFeeIncluded: {
      type: Number,
      default: 0,
      min: [0, 'Late fee cannot be negative']
    },
    paymentMode: {
      type: String,
      enum: {
        values: ['Cash', 'UPI', 'Card', 'Net Banking'],
        message: '{VALUE} is not a supported payment mode'
      },
      required: [true, 'Payment mode is required']
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    transactionReference: {
      type: String,
      trim: true,
      default: ''
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      trim: true,
      default: 'Payment received successfully'
    }
  },
  {
    timestamps: true
  }
);

// Index for quick student payment history lookups
paymentSchema.index({ student: 1, feeStructure: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
