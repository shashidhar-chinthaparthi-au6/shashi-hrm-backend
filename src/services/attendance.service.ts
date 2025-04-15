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
    const record = await Attendance.findByIdAndUpdate(
      recordId,
      { $set: data },
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
}

export const attendanceService = new AttendanceService(); 