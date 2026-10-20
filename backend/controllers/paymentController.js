import Payment from '../models/Payment.js';
import FeeStructure from '../models/FeeStructure.js';
import User from '../models/User.js';

// Helper to generate next unique receipt number
export const generateReceiptNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `RCP-${currentYear}-`;

  // Find the latest receipt of this year
  const latestPayment = await Payment.findOne({
    receiptNo: { $regex: `^${prefix}` }
  })
    .sort({ createdAt: -1 })
    .select('receiptNo');

  let nextSequence = 1;
  if (latestPayment && latestPayment.receiptNo) {
    const parts = latestPayment.receiptNo.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  // Double check uniqueness loop
  let receiptNo = `${prefix}${String(nextSequence).padStart(4, '0')}`;
  let exists = await Payment.findOne({ receiptNo });
  while (exists) {
    nextSequence++;
    receiptNo = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    exists = await Payment.findOne({ receiptNo });
  }

  return receiptNo;
};

// Helper to compute fee dues, late fees, and status
export const computeFeeStatus = async (studentId, feeStructureId, paymentDate = new Date()) => {
  const feeStructure = await FeeStructure.findById(feeStructureId);
  if (!feeStructure) {
    throw new Error('Fee structure not found');
  }

  // All payments made by this student for this fee structure
  const payments = await Payment.find({
    student: studentId,
    feeStructure: feeStructureId
  }).sort({ paymentDate: 1 });

  const totalPaid = payments.reduce((acc, curr) => acc + curr.amountPaid, 0);

  // Late fee calculation: if payment date is after due date and pending amount > 0
  let lateFee = 0;
  const payDateObj = new Date(paymentDate);
  const dueDateObj = new Date(feeStructure.dueDate);

  if (payDateObj > dueDateObj) {
    const diffTime = payDateObj.getTime() - dueDateObj.getTime();
    const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    lateFee = Math.max(0, overdueDays * (feeStructure.lateFeePerDay || 0));
  }

  const totalPayable = feeStructure.totalAmount + lateFee;
  const pendingAmount = Math.max(0, totalPayable - totalPaid);

  let status = 'Unpaid';
  if (totalPaid >= totalPayable && totalPayable > 0) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partially Paid';
  }

  return {
    feeStructure,
    totalBaseFee: feeStructure.totalAmount,
    lateFee,
    totalPayable,
    totalPaid,
    pendingAmount,
    status,
    payments
  };
};

// @desc    Record a new payment
// @route   POST /api/payments
// @access  Private/Admin
export const recordPayment = async (req, res, next) => {
  try {
    const {
      studentId,
      feeStructureId,
      amount,
      paymentMode,
      paymentDate,
      transactionReference,
      remarks
    } = req.body;

    const amountPaid = Number(amount);

    // Business Rule 1: Reject zero or negative payments
    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount. Amount must be greater than zero.'
      });
    }

    if (!studentId || !feeStructureId || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Student, fee structure, and payment mode are required.'
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Valid student account not found'
      });
    }

    const dateToUse = paymentDate ? new Date(paymentDate) : new Date();

    // Compute existing status
    const summary = await computeFeeStatus(studentId, feeStructureId, dateToUse);

    // Business Rule 2: Cannot pay if already completely settled
    if (summary.pendingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'All fees for this structure are already settled. No pending balance.'
      });
    }

    // Business Rule 3: Reject payments exceeding pending amount
    if (amountPaid > summary.pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amountPaid.toLocaleString('en-IN')}) exceeds the remaining pending balance of ₹${summary.pendingAmount.toLocaleString('en-IN')}.`
      });
    }

    // Generate unique receipt number
    const receiptNo = await generateReceiptNumber();

    const payment = await Payment.create({
      receiptNo,
      student: student._id,
      feeStructure: feeStructureId,
      amountPaid,
      lateFeeIncluded: summary.lateFee,
      paymentMode,
      paymentDate: dateToUse,
      transactionReference: transactionReference || '',
      recordedBy: req.user._id,
      remarks: remarks || 'Fee payment received'
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'name email rollNumber course semester phone')
      .populate('feeStructure', 'course academicYear semester totalAmount dueDate feeHeads')
      .populate('recordedBy', 'name email');

    // Recalculate status after payment
    const updatedSummary = await computeFeeStatus(studentId, feeStructureId, dateToUse);

    res.status(201).json({
      success: true,
      message: `Payment of ₹${amountPaid.toLocaleString('en-IN')} recorded successfully. Receipt generated: ${receiptNo}`,
      data: populatedPayment,
      summary: {
        totalPayable: updatedSummary.totalPayable,
        totalPaid: updatedSummary.totalPaid,
        pendingAmount: updatedSummary.pendingAmount,
        status: updatedSummary.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment by receipt number
// @route   GET /api/payments/receipt/:receiptNo
// @access  Private (Admin or the student themselves)
export const getPaymentByReceiptNo = async (req, res, next) => {
  try {
    const { receiptNo } = req.params;

    const payment = await Payment.findOne({ receiptNo: receiptNo.toUpperCase() })
      .populate('student', 'name email rollNumber course semester phone')
      .populate('feeStructure', 'course academicYear semester totalAmount dueDate feeHeads lateFeePerDay')
      .populate('recordedBy', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `No payment receipt found with receipt number: ${receiptNo}`
      });
    }

    // Role check: if student, they can only view their own receipt
    if (
      req.user.role === 'student' &&
      payment.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this receipt'
      });
    }

    // Compute student's overall fee standing for that structure
    const summary = await computeFeeStatus(
      payment.student._id,
      payment.feeStructure._id,
      payment.paymentDate
    );

    res.status(200).json({
      success: true,
      data: payment,
      feeSummary: {
        totalPayable: summary.totalPayable,
        totalPaid: summary.totalPaid,
        pendingAmount: summary.pendingAmount,
        status: summary.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (with filters for admin or current student)
// @route   GET /api/payments
// @access  Private
export const getAllPayments = async (req, res, next) => {
  try {
    const { studentId, paymentMode, search, course, startDate, endDate } = req.query;
    const filter = {};

    // If student, restrict to their own records only
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (studentId) {
      filter.student = studentId;
    }

    if (paymentMode) {
      filter.paymentMode = paymentMode;
    }

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.receiptNo = { $regex: search, $options: 'i' };
    }

    let query = Payment.find(filter)
      .populate('student', 'name email rollNumber course semester')
      .populate('feeStructure', 'course academicYear semester totalAmount dueDate')
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1, createdAt: -1 });

    const payments = await query;

    // Filter by course if specified
    const filteredPayments = course
      ? payments.filter((p) => p.student?.course?.toLowerCase().includes(course.toLowerCase()))
      : payments;

    res.status(200).json({
      success: true,
      count: filteredPayments.length,
      data: filteredPayments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fee summary and status for a student
// @route   GET /api/payments/student-summary/:studentId
// @access  Private
export const getStudentFeeBreakdown = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user._id;

    // If student role, ensure they are requesting their own ID
    if (req.user.role === 'student' && studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own fee summary'
      });
    }

    const student = await User.findById(studentId).select('-password');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find all fee structures applicable for this student's course & semester
    const feeStructures = await FeeStructure.find({
      course: student.course
    }).sort({ semester: 1, academicYear: -1 });

    // For each fee structure, compute paid, late fee, pending and status
    const structuresWithStatus = await Promise.all(
      feeStructures.map(async (fs) => {
        const statusData = await computeFeeStatus(student._id, fs._id);
        return {
          feeStructure: fs,
          totalBaseFee: statusData.totalBaseFee,
          lateFee: statusData.lateFee,
          totalPayable: statusData.totalPayable,
          totalPaid: statusData.totalPaid,
          pendingAmount: statusData.pendingAmount,
          status: statusData.status,
          payments: statusData.payments
        };
      })
    );

    // Aggregate totals across all fee structures
    const overallTotalBilled = structuresWithStatus.reduce((acc, curr) => acc + curr.totalPayable, 0);
    const overallTotalPaid = structuresWithStatus.reduce((acc, curr) => acc + curr.totalPaid, 0);
    const overallTotalPending = structuresWithStatus.reduce((acc, curr) => acc + curr.pendingAmount, 0);

    let overallStatus = 'Unpaid';
    if (overallTotalBilled > 0 && overallTotalPaid >= overallTotalBilled) {
      overallStatus = 'Paid';
    } else if (overallTotalPaid > 0) {
      overallStatus = 'Partially Paid';
    }

    res.status(200).json({
      success: true,
      student,
      summary: {
        totalBilled: overallTotalBilled,
        totalPaid: overallTotalPaid,
        totalPending: overallTotalPending,
        overallStatus
      },
      structures: structuresWithStatus
    });
  } catch (error) {
    next(error);
  }
};
