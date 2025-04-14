import express from 'express';
import {
  markAttendance,
  getAttendance,
  updateAttendance,
  getAttendanceReport,
} from '../controllers/attendanceController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Attendance routes
router.post('/', markAttendance);
router.get('/', getAttendance);
router.put('/:id', updateAttendance);
router.get('/report', getAttendanceReport);

export default router; 