import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { Employee } from '../models/Employee';
import { LeaveApplication } from '../models/LeaveApplication';
import { Types } from 'mongoose';

export const markAttendance = async (req: Request, res: Response) => {
  try {
    console.log('Request body:', req.body);
    const { date, checkIn, checkOut, status, notes } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    if (!checkIn) {
      return res.status(400).json({ message: 'Check-in time is required' });
    }

    // Find employee by userId
    const employee = await Employee.findOne({ userId: new Types.ObjectId(userId) });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if attendance already exists for the date
    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: new Date(date),
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    // Check if employee is on leave
    const leave = await LeaveApplication.findOne({
      employee: employee._id,
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) },
      status: 'approved',
    });

    if (leave && status !== 'on_leave') {
      return res.status(400).json({ message: 'Employee is on approved leave for this date' });
    }

    // Combine date and time for checkIn and checkOut
    const attendanceDate = new Date(date);
    const [checkInHours, checkInMinutes] = checkIn.split(':').map(Number);
    const checkInTime = new Date(attendanceDate);
    checkInTime.setHours(checkInHours, checkInMinutes, 0, 0);

    let checkOutTime;
    if (checkOut) {
      const [checkOutHours, checkOutMinutes] = checkOut.split(':').map(Number);
      checkOutTime = new Date(attendanceDate);
      checkOutTime.setHours(checkOutHours, checkOutMinutes, 0, 0);
    }

    const attendance = new Attendance({
      employee: employee._id,
      date: attendanceDate,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      status: status || 'present',
      notes,
      createdBy: userId,
      updatedBy: userId,
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error in markAttendance:', error);
    res.status(500).json({ 
      message: 'Error marking attendance', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find employee by userId
    const employee = await Employee.findOne({ userId: new Types.ObjectId(userId) });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const query: any = {
      employee: employee._id
    };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error });
  }
};

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, status, notes } = req.body;
    const userId = req.user?._id;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    attendance.checkIn = checkIn ? new Date(checkIn) : attendance.checkIn;
    attendance.checkOut = checkOut ? new Date(checkOut) : attendance.checkOut;
    attendance.status = status || attendance.status;
    attendance.notes = notes || attendance.notes;
    attendance.updatedBy = userId as Types.ObjectId;

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error updating attendance', error });
  }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { employeeId, month, year } = req.query;
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const query: any = {
      date: { $gte: startDate, $lte: endDate },
    };
    if (employeeId) query.employee = employeeId;

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName')
      .sort({ date: 1 });

    // Calculate attendance statistics
    const stats = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      halfDay: attendance.filter(a => a.status === 'half_day').length,
      onLeave: attendance.filter(a => a.status === 'on_leave').length,
    };

    res.json({ attendance, stats });
  } catch (error) {
    res.status(500).json({ message: 'Error generating attendance report', error });
  }
}; 