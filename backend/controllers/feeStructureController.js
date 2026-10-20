import FeeStructure from '../models/FeeStructure.js';

// @desc    Get all fee structures
// @route   GET /api/fee-structures
// @access  Private
export const getAllFeeStructures = async (req, res, next) => {
  try {
    const { course, semester, academicYear } = req.query;
    const filter = {};

    if (course) {
      filter.course = { $regex: course, $options: 'i' };
    }
    if (semester) {
      filter.semester = Number(semester);
    }
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const feeStructures = await FeeStructure.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feeStructures.length,
      data: feeStructures
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fee structure by ID
// @route   GET /api/fee-structures/:id
// @access  Private
export const getFeeStructureById = async (req, res, next) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    res.status(200).json({
      success: true,
      data: feeStructure
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new fee structure
// @route   POST /api/fee-structures
// @access  Private/Admin
export const createFeeStructure = async (req, res, next) => {
  try {
    const { course, academicYear, semester, feeHeads, dueDate, lateFeePerDay, remarks } = req.body;

    if (!course || !academicYear || !semester || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course, academic year, semester, and due date.'
      });
    }

    if (!feeHeads || !Array.isArray(feeHeads) || feeHeads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one fee head (e.g., Tuition Fee, Exam Fee).'
      });
    }

    // Calculate total amount from fee heads
    const totalAmount = feeHeads.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );

    const feeStructure = await FeeStructure.create({
      course,
      academicYear,
      semester: Number(semester),
      feeHeads,
      totalAmount,
      dueDate,
      lateFeePerDay: lateFeePerDay !== undefined ? Number(lateFeePerDay) : 50,
      remarks
    });

    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      data: feeStructure
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing fee structure
// @route   PUT /api/fee-structures/:id
// @access  Private/Admin
export const updateFeeStructure = async (req, res, next) => {
  try {
    let feeStructure = await FeeStructure.findById(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    const { course, academicYear, semester, feeHeads, dueDate, lateFeePerDay, remarks } = req.body;

    if (feeHeads && Array.isArray(feeHeads)) {
      if (feeHeads.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Fee structure must have at least one fee head'
        });
      }
      feeStructure.feeHeads = feeHeads;
      feeStructure.totalAmount = feeHeads.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );
    }

    if (course) feeStructure.course = course;
    if (academicYear) feeStructure.academicYear = academicYear;
    if (semester) feeStructure.semester = Number(semester);
    if (dueDate) feeStructure.dueDate = dueDate;
    if (lateFeePerDay !== undefined) feeStructure.lateFeePerDay = Number(lateFeePerDay);
    if (remarks !== undefined) feeStructure.remarks = remarks;

    await feeStructure.save();

    res.status(200).json({
      success: true,
      message: 'Fee structure updated successfully',
      data: feeStructure
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete fee structure
// @route   DELETE /api/fee-structures/:id
// @access  Private/Admin
export const deleteFeeStructure = async (req, res, next) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    await feeStructure.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Fee structure deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
