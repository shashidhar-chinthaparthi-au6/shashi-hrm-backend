import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { Employee } from '../models/Employee';
import { Shift } from '../models/Shift';
import { format, parseISO, differenceInMinutes, isWithinInterval } from 'date-fns';

interface ReportFilters {
  startDate: string;
  endDate: string;
  type: 'daily' | 'monthly' | 'late' | 'early' | 'absent';
  employeeId?: string;
  department?: string;
}

interface ReportData {
  date: string;
  employeeId: string;
  employeeName: string;
  checkIn: Date | string;
  checkOut: Date | string | undefined;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  lateMinutes: number;
  earlyDepartureMinutes: number;
  totalHours: number;
}

export const generateAttendanceReport = async (req: Request, res: Response) => {
  try {
    const filters: ReportFilters = req.query as any;
    const { startDate, endDate, type, employeeId, department } = filters;

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Base query
    let query: any = {
      date: {
        $gte: start,
        $lte: end,
      },
    };

    if (employeeId) {
      query.employee = employeeId;
    }

    // Get all attendances within the date range
    const attendances = await Attendance.find(query)
      .populate('employee', 'firstName lastName department')
      .populate('shift', 'startTime endTime');

    // Get all employees for the department if specified
    let employees = await Employee.find(
      department ? { department } : {}
    ).select('_id firstName lastName department');

    // Process data based on report type
    let reportData: ReportData[] = attendances.map((attendance) => {
      const employee = attendance.employee as any;
      const shift = attendance.shift as any;

      const checkInTime = attendance.checkIn;
      const checkOutTime = attendance.checkOut;
      
      // Calculate late and early departure minutes if shift exists
      let lateMinutes = 0;
      let earlyDepartureMinutes = 0;
      let totalHours = 0;

      if (shift) {
        const shiftStartTime = parseISO(`${attendance.date.toISOString().split('T')[0]}T${shift.startTime}`);
        const shiftEndTime = parseISO(`${attendance.date.toISOString().split('T')[0]}T${shift.endTime}`);
        
        lateMinutes = differenceInMinutes(checkInTime, shiftStartTime);
        if (checkOutTime) {
          earlyDepartureMinutes = differenceInMinutes(shiftEndTime, checkOutTime);
          totalHours = differenceInMinutes(checkOutTime, checkInTime) / 60;
        }
      }

      return {
        date: format(attendance.date, 'yyyy-MM-dd'),
        employeeId: employee._id.toString(),
        employeeName: `${employee.firstName} ${employee.lastName}`,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: attendance.status,
        lateMinutes: lateMinutes > 0 ? lateMinutes : 0,
        earlyDepartureMinutes: earlyDepartureMinutes > 0 ? earlyDepartureMinutes : 0,
        totalHours: totalHours,
      };
    });

    // Filter based on report type
    switch (type) {
      case 'late':
        reportData = reportData.filter((record) => record.lateMinutes > 0);
        break;
      case 'early':
        reportData = reportData.filter((record) => record.earlyDepartureMinutes > 0);
        break;
      case 'absent':
        // Find employees who didn't have any attendance records
        const presentEmployeeIds = new Set(attendances.map((a) => a.employee._id.toString()));
        const absentEmployees = employees.filter(
          (e) => !presentEmployeeIds.has(e._id.toString())
        );
        reportData = absentEmployees.map((employee) => ({
          date: format(start, 'yyyy-MM-dd'),
          employeeId: employee._id.toString(),
          employeeName: `${employee.firstName} ${employee.lastName}`,
          checkIn: '-',
          checkOut: '-',
          status: 'absent',
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          totalHours: 0,
        }));
        break;
    }

    res.json(reportData);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ message: 'Error generating attendance report' });
  }
};

export const exportAttendanceReport = async (req: Request, res: Response) => {
  try {
    const reportData = await generateAttendanceReport(req, res);
    // TODO: Implement export functionality (CSV, Excel, etc.)
    res.json({ message: 'Export functionality not implemented yet' });
  } catch (error) {
    console.error('Error exporting attendance report:', error);
    res.status(500).json({ message: 'Error exporting attendance report' });
  }
}; 