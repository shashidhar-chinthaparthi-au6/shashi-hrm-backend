import { Attendance, AttendanceSettings, IAttendance } from '../models/Attendance';
import { User } from '../models/User';
import type { IUser } from '../models/User';
import { startOfDay, endOfDay } from 'date-fns';
import { Types } from 'mongoose';
import ExcelJS from 'exceljs';

class AttendanceService {
  async initializeDailyAttendance(date: Date) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Check if records already exist for this date
    const existingRecords = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    if (existingRecords.length > 0) {
      return; // Records already exist for this date
    }

    // Get all active employees
    const employees = await User.find({ status: 'active' });

    // Create attendance records for each employee
    const attendanceRecords = employees.map((employee: IUser) => ({
      employeeId: employee._id,
      date: date,
      checkIn: '00:00',
      checkOut: '00:00',
      status: 'absent' as const,
    }));

    await Attendance.insertMany(attendanceRecords);
  }

  async getDailyAttendance(date: Date) {
    // First ensure records exist for this date
    await this.initializeDailyAttendance(date);

    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const records = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('employeeId', 'firstName lastName');

    return records.map(record => ({
      _id: record._id,
      employeeId: record.employeeId._id,
      employeeName: `${(record.employeeId as any).firstName} ${(record.employeeId as any).lastName}`,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      notes: record.notes
    }));
  }

  async getAttendanceReport(startDate: Date, endDate: Date) {
    const records = await Attendance.find({
      date: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate)
      }
    }).populate('employeeId', 'firstName lastName');

    return records.map(record => ({
      _id: record._id,
      employeeId: record.employeeId._id,
      employeeName: `${(record.employeeId as any).firstName} ${(record.employeeId as any).lastName}`,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      notes: record.notes
    }));
  }

  async updateAttendanceRecord(recordId: string, data: Partial<IAttendance>) {
    const { checkIn, checkOut, status, notes } = data;
    console.log('Received data:', { checkIn, checkOut, status, notes });

    // Format time values if provided
    const formatTime = (time: string) => {
      if (!time) return time;
      console.log('Formatting time:', time);
      
      // Remove any seconds or milliseconds if present
      time = time.split(':')[0] + ':' + time.split(':')[1];
      console.log('After removing seconds:', time);
      
      // Ensure two digits for hours and minutes
      const [hours, minutes] = time.split(':');
      const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      console.log('Formatted time:', formattedTime);
      return formattedTime;
    };

    const formattedData: Partial<IAttendance> = {
      ...data,
      ...(checkIn && { checkIn: formatTime(checkIn) }),
      ...(checkOut && { checkOut: formatTime(checkOut) })
    };
    console.log('Formatted data:', formattedData);

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formattedData.checkIn && !timeRegex.test(formattedData.checkIn)) {
      console.log('Invalid checkIn format:', formattedData.checkIn);
      throw new Error('Invalid check-in time format. Use HH:mm format (e.g., 09:30)');
    }
    if (formattedData.checkOut && !timeRegex.test(formattedData.checkOut)) {
      console.log('Invalid checkOut format:', formattedData.checkOut);
      throw new Error('Invalid check-out time format. Use HH:mm format (e.g., 17:30)');
    }

    // Validate status if provided
    const validStatuses = ['present', 'absent', 'late', 'half-day'];
    if (status && !validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const record = await Attendance.findByIdAndUpdate(
      recordId,
      { $set: formattedData },
      { new: true }
    ).populate('employeeId', 'firstName lastName');

    if (!record) {
      throw new Error('Attendance record not found');
    }

    return {
      _id: record._id,
      employeeId: record.employeeId._id,
      employeeName: `${(record.employeeId as any).firstName} ${(record.employeeId as any).lastName}`,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      notes: record.notes
    };
  }

  async getSettings() {
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = await AttendanceSettings.create({});
    }
    return settings;
  }

  async updateSettings(data: any) {
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = await AttendanceSettings.create(data);
    } else {
      settings = await AttendanceSettings.findOneAndUpdate(
        {},
        { $set: data },
        { new: true }
      );
    }
    return settings;
  }

  async generateExcelReport(startDate: Date, endDate: Date) {
    const records = await this.getAttendanceReport(startDate, endDate);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Add headers
    worksheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Check In', key: 'checkIn', width: 15 },
      { header: 'Check Out', key: 'checkOut', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    // Add data
    records.forEach(record => {
      worksheet.addRow({
        employeeName: record.employeeName,
        date: new Date(record.date).toLocaleDateString(),
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status: record.status,
        notes: record.notes || ''
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    return workbook;
  }

  async markAttendance(data: {
    employeeId: string;
    date: Date;
    checkIn: string;
    checkOut: string;
    status: string;
    notes?: string;
  }) {
    const { employeeId, date, checkIn, checkOut, status, notes } = data;
    
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Try to find existing record
    let record = await Attendance.findOne({
      employeeId: new Types.ObjectId(employeeId),
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    if (!record) {
      // Create new record if none exists
      record = await Attendance.create({
        employeeId: new Types.ObjectId(employeeId),
        date: date,
        checkIn,
        checkOut,
        status,
        notes
      });
    } else {
      // Update existing record
      record = await Attendance.findOneAndUpdate(
        {
          employeeId: new Types.ObjectId(employeeId),
          date: {
            $gte: startDate,
            $lte: endDate
          }
        },
        {
          $set: {
            checkIn,
            checkOut,
            status,
            notes
          }
        },
        { new: true }
      );
    }

    if (!record) {
      throw new Error('Failed to create/update attendance record');
    }

    // Populate employee details
    const populatedRecord = await Attendance.findById(record._id).populate('employeeId', 'firstName lastName');

    if (!populatedRecord) {
      throw new Error('Failed to populate attendance record');
    }

    return {
      _id: populatedRecord._id,
      employeeId: populatedRecord.employeeId._id,
      employeeName: `${(populatedRecord.employeeId as any).firstName} ${(populatedRecord.employeeId as any).lastName}`,
      date: populatedRecord.date,
      checkIn: populatedRecord.checkIn,
      checkOut: populatedRecord.checkOut,
      status: populatedRecord.status,
      notes: populatedRecord.notes
    };
  }
}

export const attendanceService = new AttendanceService(); 