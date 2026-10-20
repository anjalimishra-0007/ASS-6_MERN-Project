import mongoose from 'mongoose';

const feeHeadSchema = new mongoose.Schema({
  headName: {
    type: String,
    required: [true, 'Fee head name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Fee head amount is required'],
    min: [0, 'Fee head amount cannot be negative']
  }
});

const feeStructureSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g., 2025-2026)'],
      trim: true
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8']
    },
    feeHeads: {
      type: [feeHeadSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one fee head must be specified'
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    lateFeePerDay: {
      type: Number,
      default: 50,
      min: [0, 'Late fee cannot be negative']
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Pre-validate hook to calculate totalAmount from feeHeads if not provided or to ensure accuracy
feeStructureSchema.pre('validate', function (next) {
  if (this.feeHeads && this.feeHeads.length > 0) {
    this.totalAmount = this.feeHeads.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }
  next();
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;
