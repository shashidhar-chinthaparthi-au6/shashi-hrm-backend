import mongoose, { Document, Schema } from 'mongoose';
import { Role } from '../types/roles';

export interface IEmployee extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: Role;
  joiningDate: Date;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  userId: mongoose.Types.ObjectId;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  documents: {
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    joiningDate: { type: Date, required: true },
    salary: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    documents: [{
      type: { type: String, required: true },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ role: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ userId: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema); 