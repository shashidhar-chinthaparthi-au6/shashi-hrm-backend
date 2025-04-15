import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

export interface IAttendanceSettings extends Document {
  workHours: {
    start: string;
    end: string;
  };
  lateThreshold: number;
  halfDayThreshold: number;
}

const AttendanceSchema = new Schema({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: String,
    required: true
  },
  checkOut: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    required: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const AttendanceSettingsSchema = new Schema({
  workHours: {
    start: {
      type: String,
      required: true,
      default: '09:00'
    },
    end: {
      type: String,
      required: true,
      default: '17:00'
    }
  },
  lateThreshold: {
    type: Number,
    required: true,
    default: 15 // 15 minutes
  },
  halfDayThreshold: {
    type: Number,
    required: true,
    default: 240 // 4 hours in minutes
  }
}, {
  timestamps: true
});

// Create indexes
AttendanceSchema.index({ employeeId: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const AttendanceSettings = mongoose.model<IAttendanceSettings>('AttendanceSettings', AttendanceSettingsSchema); 