import mongoose, { Document, Schema } from 'mongoose';

export interface ILeavePolicy extends Document {
  name: string;
  description: string;
  leaveTypes: {
    leaveType: mongoose.Types.ObjectId;
    maxDays: number;
    carryForward: boolean;
    maxCarryForwardDays: number;
    encashment: boolean;
    maxEncashmentDays: number;
    encashmentRate: number;
  }[];
  approvalHierarchy: {
    level: number;
    role: string;
  }[];
  notificationSettings: {
    notifyOnApply: boolean;
    notifyOnApprove: boolean;
    notifyOnReject: boolean;
    notifyOnCancel: boolean;
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeavePolicySchema = new Schema<ILeavePolicy>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    leaveTypes: [{
      leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
      maxDays: { type: Number, required: true },
      carryForward: { type: Boolean, default: false },
      maxCarryForwardDays: { type: Number, default: 0 },
      encashment: { type: Boolean, default: false },
      maxEncashmentDays: { type: Number, default: 0 },
      encashmentRate: { type: Number, default: 0 },
    }],
    approvalHierarchy: [{
      level: { type: Number, required: true },
      role: { type: String, required: true },
    }],
    notificationSettings: {
      notifyOnApply: { type: Boolean, default: true },
      notifyOnApprove: { type: Boolean, default: true },
      notifyOnReject: { type: Boolean, default: true },
      notifyOnCancel: { type: Boolean, default: true },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
LeavePolicySchema.index({ name: 1 });

export const LeavePolicy = mongoose.model<ILeavePolicy>('LeavePolicy', LeavePolicySchema); 