import { Request, Response } from 'express';
import { Overtime } from '../models/Overtime';
import { Employee } from '../models/Employee';
import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

export const applyForOvertime = async (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime, reason } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find employee by userId
    const employee = await Employee.findOne({ userId: new Types.ObjectId(userId) });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate total hours and amount
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const rate = employee.salary / (22 * 8); // Assuming 22 working days and 8 hours per day
    const amount = totalHours * rate * 1.5; // 1.5x for overtime

    const overtime = new Overtime({
      employee: employee._id,
      date: new Date(date),
      startTime: start,
      endTime: end,
      totalHours,
      reason,
      rate,
      amount,
      createdBy: userId,
      updatedBy: userId,
    });

    await overtime.save();

    // Create notification for approvers
    const notification = new Notification({
      recipient: userId,
      type: 'overtime',
      title: 'Overtime Request',
      message: `Your overtime request for ${date} has been submitted.`,
      data: { overtimeId: overtime._id },
      createdBy: userId,
      updatedBy: userId,
    });

    await notification.save();

    res.status(201).json(overtime);
  } catch (error) {
    res.status(500).json({ message: 'Error applying for overtime', error });
  }
};

export const getOvertimeRequests = async (req: Request, res: Response) => {
  try {
    const { employeeId, status, startDate, endDate } = req.query;
    const userId = req.user?._id;

    const query: any = {};
    if (employeeId) query.employee = employeeId;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const overtimeRequests = await Overtime.find(query)
      .populate('employee', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(overtimeRequests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overtime requests', error });
  }
};

export const updateOvertimeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user?._id;

    const overtime = await Overtime.findById(id);
    if (!overtime) {
      return res.status(404).json({ message: 'Overtime request not found' });
    }

    if (overtime.status !== 'pending') {
      return res.status(400).json({ message: 'Overtime request is not pending' });
    }

    overtime.status = status;
    overtime.approvedBy = status === 'approved' ? userId : undefined;
    overtime.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
    overtime.updatedBy = userId as Types.ObjectId;

    await overtime.save();

    // Create notification for employee
    const notification = new Notification({
      recipient: overtime.employee,
      type: 'overtime',
      title: 'Overtime Status Update',
      message: `Your overtime request for ${overtime.date} has been ${status}.`,
      data: { overtimeId: overtime._id },
      createdBy: userId,
      updatedBy: userId,
    });

    await notification.save();

    res.json(overtime);
  } catch (error) {
    res.status(500).json({ message: 'Error updating overtime status', error });
  }
}; 