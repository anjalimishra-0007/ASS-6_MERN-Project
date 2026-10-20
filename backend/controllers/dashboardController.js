import Payment from '../models/Payment.js';
import FeeStructure from '../models/FeeStructure.js';
import User from '../models/User.js';
import { computeFeeStatus } from './paymentController.js';

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Collections & Mode-wise Breakdown
    const modeAgg = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMode',
          totalAmount: { $sum: '$amountPaid' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCollected = modeAgg.reduce((sum, curr) => sum + curr.totalAmount, 0);

    const modeWiseCollection = ['Cash', 'UPI', 'Card', 'Net Banking'].map((mode) => {
      const found = modeAgg.find((m) => m._id === mode);
      return {
        mode,
        totalAmount: found ? found.totalAmount : 0,
        count: found ? found.count : 0
      };
    });

    // 2. Fetch all students and all fee structures
    const students = await User.find({ role: 'student' }).select(
      'name email rollNumber course semester phone'
    );
    const feeStructures = await FeeStructure.find({});

    let totalBilled = 0;
    let totalPending = 0;
    const defaultersMap = [];
    const statusSummary = {
      paid: 0,
      partiallyPaid: 0,
      unpaid: 0
    };

    const currentDate = new Date();

    for (const student of students) {
      // Find fee structures for this student's course
      const applicableStructures = feeStructures.filter(
        (fs) => fs.course?.toLowerCase() === student.course?.toLowerCase()
      );

      let studentTotalDue = 0;
      let studentTotalPaid = 0;
      let studentHasOverdue = false;
      let maxOverdueDays = 0;
      let overdueAmount = 0;

      for (const fs of applicableStructures) {
        const statusData = await computeFeeStatus(student._id, fs._id);
        studentTotalDue += statusData.totalPayable;
        studentTotalPaid += statusData.totalPaid;

        const isOverdue = new Date(fs.dueDate) < currentDate && statusData.pendingAmount > 0;
        if (isOverdue) {
          studentHasOverdue = true;
          const diffDays = Math.ceil(
            (currentDate.getTime() - new Date(fs.dueDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays > maxOverdueDays) maxOverdueDays = diffDays;
          overdueAmount += statusData.pendingAmount;
        }
      }

      const balance = Math.max(0, studentTotalDue - studentTotalPaid);
      totalBilled += studentTotalDue;
      totalPending += balance;

      if (studentTotalDue > 0) {
        if (studentTotalPaid >= studentTotalDue) {
          statusSummary.paid += 1;
        } else if (studentTotalPaid > 0) {
          statusSummary.partiallyPaid += 1;
        } else {
          statusSummary.unpaid += 1;
        }
      } else {
        statusSummary.unpaid += 1;
      }

      if (studentHasOverdue && overdueAmount > 0) {
        defaultersMap.push({
          studentId: student._id,
          name: student.name,
          rollNumber: student.rollNumber || 'N/A',
          course: student.course,
          semester: student.semester,
          phone: student.phone || 'N/A',
          overdueAmount,
          daysOverdue: maxOverdueDays
        });
      }
    }

    // Sort defaulters by overdue amount descending
    defaultersMap.sort((a, b) => b.overdueAmount - a.overdueAmount);

    // 3. Recent 5 payments
    const recentPayments = await Payment.find({})
      .populate('student', 'name rollNumber course')
      .populate('feeStructure', 'semester academicYear')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      stats: {
        totalCollected,
        totalBilled,
        totalPending,
        totalStudents: students.length,
        statusSummary,
        modeWiseCollection,
        overdueDefaulters: defaultersMap,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};
