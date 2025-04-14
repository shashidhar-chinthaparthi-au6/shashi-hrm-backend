import { Request, Response } from 'express';
import { LeaveApplication } from '../models/LeaveApplication';
import { LeaveType } from '../models/LeaveType';
import { format, parseISO, differenceInDays } from 'date-fns';

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface LeaveHistory {
  date: string;
  leaveType: string;
  days: number;
  status: string;
}

export const getLeaveBalances = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get all leave types
    const leaveTypes = await LeaveType.find();

    // Get all approved leave applications for the employee
    const leaveApplications = await LeaveApplication.find({
      employee: employeeId,
      status: 'approved',
    }).populate('leaveType');

    // Calculate balances for each leave type
    const balances: LeaveBalance[] = await Promise.all(
      leaveTypes.map(async (leaveType) => {
        const usedDays = leaveApplications
          .filter((app) => app.leaveType._id.toString() === leaveType._id.toString())
          .reduce((total, app) => {
            const startDate = new Date(app.startDate);
            const endDate = new Date(app.endDate);
            return total + differenceInDays(endDate, startDate) + 1;
          }, 0);

        return {
          leaveType: leaveType.name,
          totalDays: leaveType?.defaultDays,
          usedDays,
          remainingDays: leaveType?.defaultDays - usedDays,
        };
      })
    );

    res.json(balances);
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({ message: 'Error fetching leave balances' });
  }
};

export const getLeaveHistory = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;
    const query: any = { employee: employeeId };

    if (startDate && endDate) {
      query.startDate = { $gte: startDate };
      query.endDate = { $lte: endDate };
    }

    const leaveApplications = await LeaveApplication.find(query)
      .populate('leaveType')
      .sort({ startDate: -1 });
    const history: LeaveHistory[] = leaveApplications.map((app) => {
      const startDate = new Date(app.startDate);
      const endDate = new Date(app.endDate); 
      const days = differenceInDays(endDate, startDate) + 1;

      return {
        date: format(startDate, 'yyyy-MM-dd'),
        leaveType: (app.leaveType as any).name,
        days,
        status: app.status,
      };
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching leave history:', error);
    res.status(500).json({ message: 'Error fetching leave history' });
  }
};

export const getLeaveUsageTrend = async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { year } = req.query;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const leaveApplications = await LeaveApplication.find({
      employee: employeeId,
      status: 'approved',
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
    }).populate('leaveType');

    // Group by month
    const monthlyData = Array(12).fill(0);
    leaveApplications.forEach((app) => {
      const startDate = new Date(app.startDate);
      const endDate = new Date(app.endDate);
      const days = differenceInDays(endDate, startDate) + 1;
      const month = startDate.getMonth();
      monthlyData[month] += days;
    });

    const trendData = monthlyData.map((days, index) => ({
      month: format(new Date(2000, index, 1), 'MMM'),
      days,
    }));

    res.json(trendData);
  } catch (error) {
    console.error('Error fetching leave usage trend:', error);
    res.status(500).json({ message: 'Error fetching leave usage trend' });
  }
}; 