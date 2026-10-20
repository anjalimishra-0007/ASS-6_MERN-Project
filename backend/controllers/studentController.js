import User from '../models/User.js';
import FeeStructure from '../models/FeeStructure.js';
import { computeFeeStatus } from './paymentController.js';

// @desc    Get all students (for admin management and fee recording dropdowns)
// @route   GET /api/students
// @access  Private/Admin
export const getAllStudents = async (req, res, next) => {
  try {
    const { search, course, semester } = req.query;
    const filter = { role: 'student' };

    if (course) {
      filter.course = { $regex: course, $options: 'i' };
    }
    if (semester) {
      filter.semester = Number(semester);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(filter)
      .select('-password')
      .sort({ rollNumber: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student profile & fee summary by ID
// @route   GET /api/students/:id
// @access  Private
export const getStudentById = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Retrieve fee structures for student course
    const feeStructures = await FeeStructure.find({
      course: student.course
    }).sort({ semester: 1 });

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

    const totalBilled = structuresWithStatus.reduce((acc, curr) => acc + curr.totalPayable, 0);
    const totalPaid = structuresWithStatus.reduce((acc, curr) => acc + curr.totalPaid, 0);
    const totalPending = structuresWithStatus.reduce((acc, curr) => acc + curr.pendingAmount, 0);

    let overallStatus = 'Unpaid';
    if (totalBilled > 0 && totalPaid >= totalBilled) {
      overallStatus = 'Paid';
    } else if (totalPaid > 0) {
      overallStatus = 'Partially Paid';
    }

    res.status(200).json({
      success: true,
      data: {
        student,
        summary: {
          totalBilled,
          totalPaid,
          totalPending,
          overallStatus
        },
        feeStructures: structuresWithStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
