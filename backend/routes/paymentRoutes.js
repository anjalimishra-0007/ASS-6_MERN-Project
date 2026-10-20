import express from 'express';
import {
  recordPayment,
  getPaymentByReceiptNo,
  getAllPayments,
  getStudentFeeBreakdown
} from '../controllers/paymentController.js';
import { protect, allowRoles } from '../middleware/authHandler.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getAllPayments)
  .post(protect, allowRoles('admin'), recordPayment);

router.get('/receipt/:receiptNo', protect, getPaymentByReceiptNo);
router.get('/student-summary/:studentId', protect, getStudentFeeBreakdown);
router.get('/my-summary', protect, getStudentFeeBreakdown);

export default router;
