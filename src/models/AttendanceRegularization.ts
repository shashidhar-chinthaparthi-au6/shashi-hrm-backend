import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceRegularization extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRegularizationSchema = new Schema<IAttendanceRegularization>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
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
AttendanceRegularizationSchema.index({ employee: 1 });
AttendanceRegularizationSchema.index({ date: 1 });
AttendanceRegularizationSchema.index({ status: 1 });

export const AttendanceRegularization = mongoose.model<IAttendanceRegularization>(
  'AttendanceRegularization',
  AttendanceRegularizationSchema
); 