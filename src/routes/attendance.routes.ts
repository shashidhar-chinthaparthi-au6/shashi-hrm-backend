import express from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get daily attendance
router.get('/daily/:date', attendanceController.getDailyAttendance);

// Get attendance report
router.get('/report', attendanceController.getAttendanceReport);

// Update attendance record
router.put('/:id', attendanceController.updateAttendanceRecord);

// Get attendance settings
router.get('/settings', attendanceController.getSettings);

// Update attendance settings
router.put('/settings', attendanceController.updateSettings);

// Download attendance report
router.get('/report/download', attendanceController.downloadReport);

export default router; 