import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveApplication extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveApplicationSchema = new Schema<ILeaveApplication>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
LeaveApplicationSchema.index({ employee: 1 });
LeaveApplicationSchema.index({ leaveType: 1 });
LeaveApplicationSchema.index({ status: 1 });
LeaveApplicationSchema.index({ startDate: 1 });
LeaveApplicationSchema.index({ endDate: 1 });

export const LeaveApplication = mongoose.model<ILeaveApplication>('LeaveApplication', LeaveApplicationSchema); 