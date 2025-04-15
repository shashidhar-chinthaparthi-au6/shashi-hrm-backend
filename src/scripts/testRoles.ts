import { AuthService } from '../services/auth.service';
import { Role } from '../types/roles';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from '../models/Employee';

// Load environment variables
dotenv.config();

async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shashi-hrm';
    await mongoose.connect(mongoURI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestUsers() {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Create test users for each role
    const testUsers = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: Role.ADMIN,
        department: 'Administration'
      },
      {
        firstName: 'HR',
        lastName: 'Manager',
        email: 'hr@example.com',
        password: 'Admin@123',
        role: Role.HR_MANAGER,
        department: 'Human Resources'
      },
      {
        firstName: 'Department',
        lastName: 'Manager',
        email: 'manager@example.com',
        password: 'Admin@123',
        role: Role.DEPARTMENT_MANAGER,
        department: 'Sales'
      },
      {
        firstName: 'Regular',
        lastName: 'Employee',
        email: 'employee@example.com',
        password: 'Admin@123',
        role: Role.EMPLOYEE,
        department: 'Sales'
      }
    ];

    for (const userData of testUsers) {
      try {
        const result = await AuthService.register(userData);
        logger.info(`Created ${userData.role}:`, {
          email: result.user.email,
          role: result.user.role
        });

        // Create employee record for each user
        const employee = new Employee({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: '1234567890',
          department: userData.department,
          position: userData.role === Role.EMPLOYEE ? 'Sales Representative' : `${userData.role.replace(/_/g, ' ')}`,
          role: userData.role,
          joiningDate: new Date(),
          salary: 50000,
          userId: result.user._id,
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            zipCode: '12345'
          },
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '9876543210'
          },
          createdBy: result.user._id,
          updatedBy: result.user._id
        });

        await employee.save();
        logger.info(`Created employee record for ${userData.role}`);
      } catch (error) {
        logger.error(`Error creating ${userData.role}:`, error);
      }
    }

    logger.info('All test users created successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error in test script:', error);
    process.exit(1);
  }
}

createTestUsers(); 