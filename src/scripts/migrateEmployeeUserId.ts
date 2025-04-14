import mongoose from 'mongoose';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

async function migrateEmployeeUserId() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm');
    console.log('Connected to MongoDB');

    // Get all employees without userId
    const employees = await Employee.find({ userId: { $exists: false } });
    console.log(`Found ${employees.length} employees without userId`);

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} total users`);

    // For each employee, find matching user by email and update
    for (const employee of employees) {
      console.log(`\nProcessing employee: ${employee.firstName} ${employee.lastName}`);
      console.log(`Employee email: ${employee.email}`);

      // Try to find user by exact email match
      let user = await User.findOne({ email: employee.email });
      
      if (!user) {
        // If no exact match, try case-insensitive match
        user = await User.findOne({ 
          email: { $regex: new RegExp(`^${employee.email}$`, 'i') } 
        });
      }

      if (user) {
        console.log(`Found matching user: ${user.firstName} ${user.lastName}`);
        console.log(`User email: ${user.email}`);
        employee.userId = user._id;
        await employee.save();
        console.log(`Updated employee ${employee._id} with userId ${user._id}`);
      } else {
        console.log(`No user found for employee ${employee._id} with email ${employee.email}`);
        console.log('Available users:');
        users.forEach(u => console.log(`- ${u.email}`));
      }
    }

    // Verify the migration
    const remainingEmployees = await Employee.find({ userId: { $exists: false } });
    console.log(`\nMigration completed. ${remainingEmployees.length} employees still without userId`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateEmployeeUserId(); 