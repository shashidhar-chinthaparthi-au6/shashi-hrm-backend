import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveBalance extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    year: { type: Number, required: true },
    totalDays: { type: Number, required: true, default: 0 },
    usedDays: { type: Number, required: true, default: 0 },
    remainingDays: { type: Number, required: true, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
LeaveBalanceSchema.index({ employee: 1 });
LeaveBalanceSchema.index({ leaveType: 1 });
LeaveBalanceSchema.index({ year: 1 });
LeaveBalanceSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });

export const LeaveBalance = mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema); 