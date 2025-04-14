import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  name: string;
  startTime: string;
  endTime: string;
  breakTime: number; // in minutes
  graceTime: number; // in minutes
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    breakTime: { type: Number, required: true, default: 60 },
    graceTime: { type: Number, required: true, default: 15 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
ShiftSchema.index({ name: 1 }, { unique: true });
ShiftSchema.index({ isActive: 1 });

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema); 