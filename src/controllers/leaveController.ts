import { Request, Response } from 'express';
import { LeaveApplication } from '../models/LeaveApplication';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeaveType } from '../models/LeaveType';
import { Employee } from '../models/Employee';
import { Types } from 'mongoose';

export const applyForLeave = async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;
    const userId = req.user?._id;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
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
    const leaveBalance = await LeaveBalance.findOne({
      employee: employeeId,
      leaveType: leaveTypeId,
      year: currentYear,
    });

    if (!leaveBalance) {
      return res.status(400).json({ message: 'Leave balance not found for this year' });
    }

    if (leaveBalance.remainingDays < leaveDays) {
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }

    // Check for overlapping leave applications
    const overlappingLeave = await LeaveApplication.findOne({
      employee: employeeId,
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
      employee: employeeId,
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