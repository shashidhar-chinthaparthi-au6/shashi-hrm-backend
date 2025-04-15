import { AuthService } from '../services/auth.service';
import { Role } from '../types/roles';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

async function createSuperAdmin() {
  try {
    // Connect to MongoDB first
    await connectDB();

    const superAdminData = {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@example.com',
      password: 'Admin@123',
      role: Role.SUPER_ADMIN,
      department: 'Administration'
    };

    const result = await AuthService.register(superAdminData);
    logger.info('Super Admin created successfully:', {
      email: result.user.email,
      role: result.user.role
    });
    process.exit(0);
  } catch (error) {
    logger.error('Error creating Super Admin:', error);
    process.exit(1);
  }
}

createSuperAdmin(); 