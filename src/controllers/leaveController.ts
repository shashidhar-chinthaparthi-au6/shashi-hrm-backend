import { Request, Response } from 'express';
import { LeaveApplication, ILeaveApplication } from '../models/LeaveApplication';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeaveType } from '../models/LeaveType';
import { Employee } from '../models/Employee';
import { Types } from 'mongoose';

interface PopulatedLeaveType {
  _id: Types.ObjectId;
  name: string;
}

interface PopulatedUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
}

interface PopulatedLeaveApplication extends Omit<ILeaveApplication, 'leaveType' | 'approvedBy'> {
  leaveType: PopulatedLeaveType;
  approvedBy?: PopulatedUser;
}

export const applyForLeave = async (req: Request, res: Response) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if employee exists
    const employee = await Employee.findOne({ userId: userId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if leave type exists
    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    // Calculate number of leave days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const currentYear = new Date().getFullYear();
    let leaveBalance = await LeaveBalance.findOne({
      employee: employee._id,
      leaveType: leaveTypeId,
      year: currentYear,
    });

    // If no leave balance exists, create one with default days
    if (!leaveBalance) {
      leaveBalance = new LeaveBalance({
        employee: employee._id,
        leaveType: leaveTypeId,
        year: currentYear,
        totalDays: leaveType.defaultDays,
        usedDays: 0,
        remainingDays: leaveType.defaultDays,
        createdBy: userId,
        updatedBy: userId,
      });
      await leaveBalance.save();
    }

    if (leaveBalance.remainingDays < leaveDays) {
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }

    // Check for overlapping leave applications
    const overlappingLeave = await LeaveApplication.findOne({
      employee: employee._id,
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
      status: 'approved',
    });

    if (overlappingLeave) {
      return res.status(400).json({ message: 'Overlapping leave application exists' });
    }

    const leaveApplication = new LeaveApplication({
      employee: employee._id,
      leaveType: leaveTypeId,
      startDate: start,
      endDate: end,
      reason,
      createdBy: userId,
      updatedBy: userId,
    });

    await leaveApplication.save();
    res.status(201).json(leaveApplication);
  } catch (error) {
    res.status(500).json({ message: 'Error applying for leave', error });
  }
};

export const getLeaveApplications = async (req: Request, res: Response) => {
  try {
    const { employeeId, status, startDate, endDate } = req.query;

    const query: any = {};
    if (employeeId) query.employee = employeeId;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate as string) };
      query.endDate = { $lte: new Date(endDate as string) };
    }

    const leaveApplications = await LeaveApplication.find(query)
      .populate('employee', 'firstName lastName')
      .populate('leaveType', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(leaveApplications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave applications', error });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user?._id;

    const leaveApplication = await LeaveApplication.findById(id);
    if (!leaveApplication) {
      return res.status(404).json({ message: 'Leave application not found' });
    }

    if (leaveApplication.status !== 'pending') {
      return res.status(400).json({ message: 'Leave application is not pending' });
    }

    leaveApplication.status = status;
    leaveApplication.approvedBy = status === 'approved' ? userId : undefined;
    leaveApplication.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
    leaveApplication.updatedBy = userId as Types.ObjectId;

    await leaveApplication.save();

    // Update leave balance if approved
    if (status === 'approved') {
      const start = new Date(leaveApplication.startDate);
      const end = new Date(leaveApplication.endDate);
      const leaveDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const currentYear = new Date().getFullYear();
      await LeaveBalance.findOneAndUpdate(
        {
          employee: leaveApplication.employee,
          leaveType: leaveApplication.leaveType,
          year: currentYear,
        },
        {
          $inc: {
            usedDays: leaveDays,
            remainingDays: -leaveDays,
          },
        }
      );
    }

    res.json(leaveApplication);
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave status', error });
  }
};

export const getLeaveBalance = async (req: Request, res: Response) => {
  try {
    const { employeeId, year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const query: any = { year: currentYear };
    if (employeeId) query.employee = employeeId;

    const leaveBalances = await LeaveBalance.find(query)
      .populate('employee', 'firstName lastName')
      .populate('leaveType', 'name defaultDays isPaid');

    res.json(leaveBalances);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave balance', error });
  }
};

export const getLeaveHistory = async (req: Request, res: Response) => {
  try {
    const { employeeId, year, leaveTypeId } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find employee
    const employee = await Employee.findOne(
      employeeId ? { _id: employeeId } : { userId }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Build query
    const query: any = { employee: employee._id };
    if (year) {
      const startDate = new Date(Number(year), 0, 1);
      const endDate = new Date(Number(year), 11, 31);
      query.startDate = { $gte: startDate };
      query.endDate = { $lte: endDate };
    }
    if (leaveTypeId) {
      query.leaveType = leaveTypeId;
    }

    // Get leave history
    const leaveHistory = await LeaveApplication.find(query)
      .populate('leaveType', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ startDate: -1 }) as unknown as PopulatedLeaveApplication[];

    // Format response
    const formattedHistory = leaveHistory.map(leave => ({
      id: leave._id,
      leaveType: leave.leaveType.name,
      startDate: leave.startDate,
      endDate: leave.endDate,
      status: leave.status,
      reason: leave.reason,
      approvedBy: leave.approvedBy ? `${leave.approvedBy.firstName} ${leave.approvedBy.lastName}` : null,
      rejectionReason: leave.rejectionReason,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching leave history:', error);
    res.status(500).json({ message: 'Error fetching leave history' });
  }
};

export const getLeaveUsageTrend = async (req: Request, res: Response) => {
  try {
    const { employeeId, year, leaveTypeId } = req.query;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find employee
    const employee = await Employee.findOne(
      employeeId ? { _id: employeeId } : { userId }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Build query
    const query: any = { employee: employee._id, status: 'approved' };
    if (year) {
      const startDate = new Date(Number(year), 0, 1);
      const endDate = new Date(Number(year), 11, 31);
      query.startDate = { $gte: startDate };
      query.endDate = { $lte: endDate };
    }
    if (leaveTypeId) {
      query.leaveType = leaveTypeId;
    }

    // Get approved leaves
    const approvedLeaves = await LeaveApplication.find(query)
      .populate('leaveType', 'name')
      .sort({ startDate: 1 }) as unknown as PopulatedLeaveApplication[];

    // Calculate monthly trends
    const monthlyTrends: { [key: string]: number } = {};
    const leaveTypeTrends: { [key: string]: number } = {};

    approvedLeaves.forEach(leave => {
      // Monthly trend
      const month = leave.startDate.toISOString().substring(0, 7); // YYYY-MM
      const days = Math.ceil((leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      monthlyTrends[month] = (monthlyTrends[month] || 0) + days;

      // Leave type trend
      const leaveTypeName = leave.leaveType.name;
      leaveTypeTrends[leaveTypeName] = (leaveTypeTrends[leaveTypeName] || 0) + days;
    });

    // Format response
    const response = {
      monthlyTrends: Object.entries(monthlyTrends).map(([month, days]) => ({
        month,
        days,
      })),
      leaveTypeTrends: Object.entries(leaveTypeTrends).map(([leaveType, days]) => ({
        leaveType,
        days,
      })),
      totalDays: Object.values(monthlyTrends).reduce((sum, days) => sum + days, 0),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching leave usage trend:', error);
    res.status(500).json({ message: 'Error fetching leave usage trend' });
  }
}; 