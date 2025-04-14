import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { Employee } from '../models/Employee';
import { LeaveApplication } from '../models/LeaveApplication';
import { Types } from 'mongoose';
import { format, parseISO, differenceInMinutes } from 'date-fns';

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

export const getAttendanceByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const attendance = await Attendance.find({ date: parseISO(date) })
      .populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by date' });
  }
};

export const getAttendanceByEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const attendance = await Attendance.find({ employee: employeeId })
      .populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee' });
  }
};

export const getAttendanceByDepartment = async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    const employees = await Employee.find({ department });
    const employeeIds = employees.map(emp => emp._id);
    const attendance = await Attendance.find({ employee: { $in: employeeIds } })
      .populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by department' });
  }
};

export const getAttendanceByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const attendance = await Attendance.find({ status })
      .populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by status' });
  }
};

export const getAttendanceByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.params;
    const attendance = await Attendance.find({
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by date range' });
  }
};

export const getAttendanceByEmployeeAndDateRange = async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.params;
    const attendance = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee and date range' });
  }
};

export const getAttendanceByDepartmentAndDateRange = async (req: Request, res: Response) => {
  try {
    const { department, startDate, endDate } = req.params;
    const employees = await Employee.find({ department });
    const employeeIds = employees.map(emp => emp._id);
    const attendance = await Attendance.find({
      employee: { $in: employeeIds },
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by department and date range' });
  }
};

export const getAttendanceByStatusAndDateRange = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.params;
    const attendance = await Attendance.find({
      status,
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by status and date range' });
  }
};

export const getAttendanceByEmployeeAndStatus = async (req: Request, res: Response) => {
  try {
    const { employeeId, status } = req.params;
    const attendance = await Attendance.find({
      employee: employeeId,
      status
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee and status' });
  }
};

export const getAttendanceByDepartmentAndStatus = async (req: Request, res: Response) => {
  try {
    const { department, status } = req.params;
    const employees = await Employee.find({ department });
    const employeeIds = employees.map(emp => emp._id);
    const attendance = await Attendance.find({
      employee: { $in: employeeIds },
      status
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by department and status' });
  }
};

export const getAttendanceByEmployeeAndDepartment = async (req: Request, res: Response) => {
  try {
    const { employeeId, department } = req.params;
    const employee = await Employee.findOne({ _id: employeeId, department });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found in specified department' });
    }
    const attendance = await Attendance.find({ employee: employeeId })
      .populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee and department' });
  }
};

export const getAttendanceByEmployeeAndStatusAndDateRange = async (req: Request, res: Response) => {
  try {
    const { employeeId, status, startDate, endDate } = req.params;
    const attendance = await Attendance.find({
      employee: employeeId,
      status,
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee, status and date range' });
  }
};

export const getAttendanceByDepartmentAndStatusAndDateRange = async (req: Request, res: Response) => {
  try {
    const { department, status, startDate, endDate } = req.params;
    const employees = await Employee.find({ department });
    const employeeIds = employees.map(emp => emp._id);
    const attendance = await Attendance.find({
      employee: { $in: employeeIds },
      status,
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by department, status and date range' });
  }
};

export const getAttendanceByEmployeeAndDepartmentAndDateRange = async (req: Request, res: Response) => {
  try {
    const { employeeId, department, startDate, endDate } = req.params;
    const employee = await Employee.findOne({ _id: employeeId, department });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found in specified department' });
    }
    const attendance = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee, department and date range' });
  }
};

export const getAttendanceByEmployeeAndDepartmentAndStatus = async (req: Request, res: Response) => {
  try {
    const { employeeId, department, status } = req.params;
    const employee = await Employee.findOne({ _id: employeeId, department });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found in specified department' });
    }
    const attendance = await Attendance.find({
      employee: employeeId,
      status
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee, department and status' });
  }
};

export const getAttendanceByEmployeeAndDepartmentAndStatusAndDateRange = async (req: Request, res: Response) => {
  try {
    const { employeeId, department, status, startDate, endDate } = req.params;
    const employee = await Employee.findOne({ _id: employeeId, department });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found in specified department' });
    }
    const attendance = await Attendance.find({
      employee: employeeId,
      status,
      date: {
        $gte: parseISO(startDate),
        $lte: parseISO(endDate)
      }
    }).populate('employee', 'name employeeId department');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance by employee, department, status and date range' });
  }
}; 