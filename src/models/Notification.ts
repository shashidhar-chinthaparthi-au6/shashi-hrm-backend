import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'attendance' | 'leave' | 'overtime' | 'regularization' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['attendance', 'leave', 'overtime', 'regularization', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Add indexes for better query performance
NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema); 