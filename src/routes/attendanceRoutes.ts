import express from 'express';
import {
  markAttendance,
  getAttendance,
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAttendanceByDepartment,
  getAttendanceByStatus,
  getAttendanceByDateRange,
  getAttendanceByEmployeeAndDateRange,
  getAttendanceByDepartmentAndDateRange,
  getAttendanceByStatusAndDateRange,
  getAttendanceByEmployeeAndStatus,
  getAttendanceByDepartmentAndStatus,
  getAttendanceByEmployeeAndDepartment,
  getAttendanceByEmployeeAndStatusAndDateRange,
  getAttendanceByDepartmentAndStatusAndDateRange,
  getAttendanceByEmployeeAndDepartmentAndDateRange,
  getAttendanceByEmployeeAndDepartmentAndStatus,
  getAttendanceByEmployeeAndDepartmentAndStatusAndDateRange,
} from '../controllers/attendanceController';
import {
  applyForRegularization,
  getRegularizationRequests,
  updateRegularizationStatus,
} from '../controllers/attendanceRegularizationController';
import {
  generateAttendanceReport,
  exportAttendanceReport,
} from '../controllers/attendanceReportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Attendance marking routes
router.post('/mark', authenticate, markAttendance);
router.get('/:id', authenticate, getAttendance);
router.get('/date/:date', authenticate, getAttendanceByDate);
router.get('/employee/:employeeId', authenticate, getAttendanceByEmployee);
router.get('/department/:department', authenticate, getAttendanceByDepartment);
router.get('/status/:status', authenticate, getAttendanceByStatus);
router.get('/date-range/:startDate/:endDate', authenticate, getAttendanceByDateRange);
router.get('/employee/:employeeId/date-range/:startDate/:endDate', authenticate, getAttendanceByEmployeeAndDateRange);
router.get('/department/:department/date-range/:startDate/:endDate', authenticate, getAttendanceByDepartmentAndDateRange);
router.get('/status/:status/date-range/:startDate/:endDate', authenticate, getAttendanceByStatusAndDateRange);
router.get('/employee/:employeeId/status/:status', authenticate, getAttendanceByEmployeeAndStatus);
router.get('/department/:department/status/:status', authenticate, getAttendanceByDepartmentAndStatus);
router.get('/employee/:employeeId/department/:department', authenticate, getAttendanceByEmployeeAndDepartment);
router.get('/employee/:employeeId/status/:status/date-range/:startDate/:endDate', authenticate, getAttendanceByEmployeeAndStatusAndDateRange);
router.get('/department/:department/status/:status/date-range/:startDate/:endDate', authenticate, getAttendanceByDepartmentAndStatusAndDateRange);
router.get('/employee/:employeeId/department/:department/date-range/:startDate/:endDate', authenticate, getAttendanceByEmployeeAndDepartmentAndDateRange);
router.get('/employee/:employeeId/department/:department/status/:status', authenticate, getAttendanceByEmployeeAndDepartmentAndStatus);
router.get('/employee/:employeeId/department/:department/status/:status/date-range/:startDate/:endDate', authenticate, getAttendanceByEmployeeAndDepartmentAndStatusAndDateRange);

// Attendance regularization routes
router.post('/regularization/apply', authenticate, applyForRegularization);
router.get('/regularization/requests', authenticate, getRegularizationRequests);
router.put('/regularization/:id/status', authenticate, updateRegularizationStatus);

// Attendance report routes
router.get('/reports/generate', authenticate, generateAttendanceReport);
router.get('/reports/export', authenticate, exportAttendanceReport);

export default router; 