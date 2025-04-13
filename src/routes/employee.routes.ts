import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all employees
router.get('/', EmployeeController.getAllEmployees);

// Get employee by ID
router.get('/:id', EmployeeController.getEmployeeById);

// Create new employee
router.post('/', EmployeeController.createEmployee);

// Update employee
router.put('/:id', EmployeeController.updateEmployee);

// Delete employee
router.delete('/:id', EmployeeController.deleteEmployee);

// Get employees by department
router.get('/department/:department', EmployeeController.getEmployeesByDepartment);

// Update employee status
router.patch('/:id/status', EmployeeController.updateEmployeeStatus);

export default router; 