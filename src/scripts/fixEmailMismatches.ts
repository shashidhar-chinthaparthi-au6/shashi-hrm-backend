import mongoose from 'mongoose';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

async function fixEmailMismatches() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm');
    console.log('Connected to MongoDB');

    // Get all employees and users
    const employees = await Employee.find({});
    const users = await User.find({});

    console.log(`Found ${employees.length} employees and ${users.length} users`);

    // Create maps for quick lookup
    const employeeMap = new Map(employees.map(e => [e.email.toLowerCase(), e]));
    const userMap = new Map(users.map(u => [u.email.toLowerCase(), u]));

    console.log('\nEmail Mismatches:');
    console.log('=================');

    // Check for mismatches
    for (const [email, employee] of employeeMap) {
      const user = userMap.get(email);
      if (!user) {
        console.log(`\nEmployee without matching user:`);
        console.log(`Employee: ${employee.firstName} ${employee.lastName}`);
        console.log(`Email: ${employee.email}`);
        console.log(`ID: ${employee._id}`);
      }
    }

    for (const [email, user] of userMap) {
      const employee = employeeMap.get(email);
      if (!employee) {
        console.log(`\nUser without matching employee:`);
        console.log(`User: ${user.firstName} ${user.lastName}`);
        console.log(`Email: ${user.email}`);
        console.log(`ID: ${user._id}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

fixEmailMismatches(); 