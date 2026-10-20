import express from 'express';
import {
  getAllFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
} from '../controllers/feeStructureController.js';
import { protect, allowRoles } from '../middleware/authHandler.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getAllFeeStructures)
  .post(protect, allowRoles('admin'), createFeeStructure);

router
  .route('/:id')
  .get(protect, getFeeStructureById)
  .put(protect, allowRoles('admin'), updateFeeStructure)
  .delete(protect, allowRoles('admin'), deleteFeeStructure);

export default router;
