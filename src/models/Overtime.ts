import mongoose, { Document, Schema } from 'mongoose';

export interface IOvertime extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  startTime: Date;
  endTime: Date;
  totalHours: number;
  rate: number;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OvertimeSchema = new Schema<IOvertime>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalHours: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
OvertimeSchema.index({ employee: 1 });
OvertimeSchema.index({ date: 1 });
OvertimeSchema.index({ status: 1 });

export const Overtime = mongoose.model<IOvertime>('Overtime', OvertimeSchema); 