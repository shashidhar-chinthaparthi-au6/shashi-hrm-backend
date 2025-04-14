import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveType extends Document {
  name: string;
  description: string;
  defaultDays: number;
  isPaid: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    defaultDays: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, required: true, default: true },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
LeaveTypeSchema.index({ name: 1 });
LeaveTypeSchema.index({ isActive: 1 });

export const LeaveType = mongoose.model<ILeaveType>('LeaveType', LeaveTypeSchema); 