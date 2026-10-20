import express from 'express';
import { getAllStudents, getStudentById } from '../controllers/studentController.js';
import { protect, allowRoles } from '../middleware/authHandler.js';

const router = express.Router();

router.get('/', protect, allowRoles('admin'), getAllStudents);
router.get('/:id', protect, allowRoles('admin'), getStudentById);

export default router;
