import Payment from '../models/Payment.js';
import FeeStructure from '../models/FeeStructure.js';
import User from '../models/User.js';

// Helper to generate a unique receipt number like RCP-2026-0001
export const generateReceiptNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await Payment.countDocuments();
  const nextSeq = String(count + 1).padStart(4, '0');
  let receiptNo = `RCP-${currentYear}-${nextSeq}`;

  // Ensure uniqueness in case of any duplicate sequence
  let existing = await Payment.findOne({ receiptNo });
  let counter = count + 1;
  while (existing) {
    counter++;
    receiptNo = `RCP-${currentYear}-${String(counter).padStart(4, '0')}`;
    existing = await Payment.findOne({ receiptNo });
  }

  return receiptNo;
};

// Helper function to calculate student fees, late fees, and current status
export const computeFeeStatus = async (studentId, feeStructureId, paymentDate = new Date()) => {
  const feeStructure = await FeeStructure.findById(feeStructureId);
  if (!feeStructure) {
    throw new Error('Fee structure not found');
  }

  // 1. Find all payments made by this student for this fee structure
  const payments = await Payment.find({
    student: studentId,
    feeStructure: feeStructureId
  }).sort({ paymentDate: 1 });

  // 2. Sum up total amount already paid
  let totalPaid = 0;
  for (let i = 0; i < payments.length; i++) {
    totalPaid += payments[i].amountPaid;
  }

  // 3. Calculate late fee if payment is after due date
  let lateFee = 0;
  const payDateObj = new Date(paymentDate);
  const dueDateObj = new Date(feeStructure.dueDate);

  if (payDateObj > dueDateObj) {
    const diffTime = payDateObj.getTime() - dueDateObj.getTime();
    const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    lateFee = Math.max(0, overdueDays * (feeStructure.lateFeePerDay || 0));
  }

  // 4. Calculate total payable and remaining balance
  const totalPayable = feeStructure.totalAmount + lateFee;
  const pendingAmount = Math.max(0, totalPayable - totalPaid);

  // 5. Status Workflow: Unpaid -> Partially Paid -> Paid
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

// @desc    Record a new payment (Admin only)
// @route   POST /api/payments
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

    // Business Rule 1: Reject zero or negative payment
    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.'
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
        message: 'Student account not found.'
      });
    }

    const dateToUse = paymentDate ? new Date(paymentDate) : new Date();

    // Check existing standing for this fee structure
    const summary = await computeFeeStatus(studentId, feeStructureId, dateToUse);

    // Business Rule 2: Cannot pay if already completely settled
    if (summary.pendingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'All fees for this structure are already settled. No pending balance.'
      });
    }

    // Business Rule 3: Reject payment if it exceeds pending balance (prevent overpayment)
    if (amountPaid > summary.pendingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amountPaid}) cannot exceed the pending balance of ₹${summary.pendingAmount}.`
      });
    }

    // Generate unique receipt number
    const receiptNo = await generateReceiptNumber();

    // Save payment to database
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

    // Populate references to send in response
    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'name email rollNumber course semester phone')
      .populate('feeStructure', 'course academicYear semester totalAmount dueDate feeHeads')
      .populate('recordedBy', 'name email');

    // Recalculate status after this payment
    const updatedSummary = await computeFeeStatus(studentId, feeStructureId, dateToUse);

    res.status(201).json({
      success: true,
      message: `Payment of ₹${amountPaid} recorded successfully. Receipt generated: ${receiptNo}`,
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

// @desc    Get single receipt by receipt number
// @route   GET /api/payments/receipt/:receiptNo
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

    // If logged in user is a student, ensure they only access their own receipt
    if (req.user.role === 'student' && payment.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this receipt'
      });
    }

    // Get overall fee standing
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

// @desc    Get list of payments
// @route   GET /api/payments
export const getAllPayments = async (req, res, next) => {
  try {
    const { studentId, paymentMode, search, course } = req.query;
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

    if (search) {
      filter.receiptNo = { $regex: search, $options: 'i' };
    }

    let payments = await Payment.find(filter)
      .populate('student', 'name email rollNumber course semester')
      .populate('feeStructure', 'course academicYear semester totalAmount dueDate')
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 });

    if (course) {
      payments = payments.filter((p) =>
        p.student?.course?.toLowerCase().includes(course.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student fee breakdown and ledger
// @route   GET /api/payments/student-summary/:studentId
export const getStudentFeeBreakdown = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user._id;

    // Student can only access their own data
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

    // Find all fee structures for this student's course
    const feeStructures = await FeeStructure.find({
      course: student.course
    }).sort({ semester: 1 });

    const structuresWithStatus = [];
    let overallTotalBilled = 0;
    let overallTotalPaid = 0;
    let overallTotalPending = 0;

    for (let i = 0; i < feeStructures.length; i++) {
      const fs = feeStructures[i];
      const statusData = await computeFeeStatus(student._id, fs._id);

      overallTotalBilled += statusData.totalPayable;
      overallTotalPaid += statusData.totalPaid;
      overallTotalPending += statusData.pendingAmount;

      structuresWithStatus.push({
        feeStructure: fs,
        totalBaseFee: statusData.totalBaseFee,
        lateFee: statusData.lateFee,
        totalPayable: statusData.totalPayable,
        totalPaid: statusData.totalPaid,
        pendingAmount: statusData.pendingAmount,
        status: statusData.status,
        payments: statusData.payments
      });
    }

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
