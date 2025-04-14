import { Response } from 'express';
import { Employee, IEmployee } from '../models/Employee';
import { User } from '../models/User';
import { Role, rolePermissions } from '../types/roles';
import { handleError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

export class EmployeeController {
  // Get all employees (with role-based filtering)
  static async getAllEmployees(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role as Role;
      const permissions = rolePermissions[userRole];

      if (!permissions?.employees?.read) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const employees = await Employee.find()
        .select('-__v')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      res.json(employees);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Get employee by ID
  static async getEmployeeById(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role as Role;
      const permissions = rolePermissions[userRole];

      if (!permissions?.employees?.read) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const employee = await Employee.findById(req.params.id)
        .select('-__v')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Create new employee
  static async createEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role as Role;
      const permissions = rolePermissions[userRole];

      if (!permissions?.employees?.write) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { email, password, ...employeeData } = req.body;

      // Create user account
      const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);
      const user = new User({
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email,
        password: hashedPassword,
        role: employeeData.role || Role.EMPLOYEE,
        department: employeeData.department,
        isActive: true,
      });
      await user.save();

      // Create employee record with userId
      const employee = new Employee({
        ...employeeData,
        email,
        userId: user._id, // Set the userId field
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
      });
      await employee.save();

      res.status(201).json(employee);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Update employee
  static async updateEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role as Role;
      const permissions = rolePermissions[userRole];

      if (!permissions?.employees?.write) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          updatedBy: req.user?._id,
        },
        { new: true }
      );

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Delete employee
  static async deleteEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role as Role;
      const permissions = rolePermissions[userRole];

      if (!permissions?.employees?.delete) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const employee = await Employee.findByIdAndDelete(req.params.id);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      handleError(res, error);
    }
  }

  // Get employees by department
  static async getEmployeesByDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role as Role;
      const permissions = rolePermissions[userRole];

      if (!permissions?.employees?.read) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const employees = await Employee.find({ department: req.params.departmentId })
        .select('-__v')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      res.json(employees);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Update employee status
  static async updateEmployeeStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role as Role;
      const permissions = rolePermissions[userRole];

      if (!permissions?.employees?.write) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          updatedBy: req.user?._id,
        },
        { new: true }
      );

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      handleError(res, error);
    }
  }
} 