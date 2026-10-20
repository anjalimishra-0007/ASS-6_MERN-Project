import Payment from '../models/Payment.js';
import FeeStructure from '../models/FeeStructure.js';
import User from '../models/User.js';
import { computeFeeStatus } from './paymentController.js';

// Get Admin Dashboard Analytics
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    // Step 1: Fetch all payments from the database
    const allPayments = await Payment.find();

    // Step 2: Calculate total collected and mode-wise totals using a simple loop
    let totalCollected = 0;
    const modeCounts = {
      'Cash': { totalAmount: 0, count: 0 },
      'UPI': { totalAmount: 0, count: 0 },
      'Card': { totalAmount: 0, count: 0 },
      'Net Banking': { totalAmount: 0, count: 0 }
    };

    for (let i = 0; i < allPayments.length; i++) {
      const p = allPayments[i];
      totalCollected += p.amountPaid;

      if (modeCounts[p.paymentMode]) {
        modeCounts[p.paymentMode].totalAmount += p.amountPaid;
        modeCounts[p.paymentMode].count += 1;
      }
    }

    const modeWiseCollection = [
      { mode: 'Cash', totalAmount: modeCounts['Cash'].totalAmount, count: modeCounts['Cash'].count },
      { mode: 'UPI', totalAmount: modeCounts['UPI'].totalAmount, count: modeCounts['UPI'].count },
      { mode: 'Card', totalAmount: modeCounts['Card'].totalAmount, count: modeCounts['Card'].count },
      { mode: 'Net Banking', totalAmount: modeCounts['Net Banking'].totalAmount, count: modeCounts['Net Banking'].count }
    ];

    // Step 3: Fetch all students and fee structures
    const students = await User.find({ role: 'student' }).select('name email rollNumber course semester phone');
    const feeStructures = await FeeStructure.find();

    let totalBilled = 0;
    let totalPending = 0;
    const overdueDefaulters = [];
    const statusSummary = { paid: 0, partiallyPaid: 0, unpaid: 0 };
    const today = new Date();

    // Step 4: Loop through each student to calculate their fees & check for overdue balance
    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Find fee structures for this student's course
      const courseStructures = feeStructures.filter(
        (fs) => fs.course.toLowerCase() === (student.course || '').toLowerCase()
      );

      let studentTotalDue = 0;
      let studentTotalPaid = 0;
      let studentOverdue = 0;
      let maxDays = 0;

      for (let j = 0; j < courseStructures.length; j++) {
        const fs = courseStructures[j];
        const feeData = await computeFeeStatus(student._id, fs._id);

        studentTotalDue += feeData.totalPayable;
        studentTotalPaid += feeData.totalPaid;

        // Check if due date has passed and student still has balance to pay
        const dueDate = new Date(fs.dueDate);
        if (dueDate < today && feeData.pendingAmount > 0) {
          const diffInMs = today.getTime() - dueDate.getTime();
          const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
          if (days > maxDays) maxDays = days;
          studentOverdue += feeData.pendingAmount;
        }
      }

      const balance = studentTotalDue - studentTotalPaid;
      totalBilled += studentTotalDue;
      if (balance > 0) {
        totalPending += balance;
      }

      // Track status counts
      if (studentTotalDue > 0 && studentTotalPaid >= studentTotalDue) {
        statusSummary.paid += 1;
      } else if (studentTotalPaid > 0) {
        statusSummary.partiallyPaid += 1;
      } else {
        statusSummary.unpaid += 1;
      }

      // Add to defaulters list if overdue
      if (studentOverdue > 0) {
        overdueDefaulters.push({
          studentId: student._id,
          name: student.name,
          rollNumber: student.rollNumber || 'N/A',
          course: student.course,
          semester: student.semester,
          phone: student.phone || 'N/A',
          overdueAmount: studentOverdue,
          daysOverdue: maxDays
        });
      }
    }

    // Step 5: Fetch latest 6 payments for the recent activity table
    const recentPayments = await Payment.find()
      .populate('student', 'name rollNumber course')
      .populate('feeStructure', 'semester academicYear')
      .sort({ createdAt: -1 })
      .limit(6);

    // Return all data as clean JSON
    res.status(200).json({
      success: true,
      stats: {
        totalCollected,
        totalBilled,
        totalPending,
        totalStudents: students.length,
        statusSummary,
        modeWiseCollection,
        overdueDefaulters,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};
