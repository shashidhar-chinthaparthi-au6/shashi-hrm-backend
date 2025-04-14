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
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find employee by userId
    const employee = await Employee.findOne({ userId: new Types.ObjectId(userId) });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate total hours
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Calculate amount (assuming rate is 1.5x normal rate)
    const rate = 1.5; // This should come from employee's salary configuration
    const amount = totalHours * rate;

    const overtime = new Overtime({
      employee: employee._id,
      date: new Date(date),
      startTime: start,
      endTime: end,
      totalHours,
      rate,
      amount,
      reason,
      createdBy: userId,
      updatedBy: userId,
    });

    await overtime.save();

    // Create notification for HR
    const hrEmployees = await Employee.find({ role: 'HR_MANAGER' });
    for (const hr of hrEmployees) {
      await Notification.create({
        recipient: hr._id,
        type: 'overtime_pending',
        title: 'New Overtime Request',
        message: `Employee ${employee.firstName} has requested overtime for ${date}`,
        metadata: {
          overtimeId: overtime._id,
        },
      });
    }

    res.status(201).json(overtime);
  } catch (error) {
    res.status(500).json({ message: 'Error applying for overtime', error });
  }
};

export const getOvertimeRequests = async (req: Request, res: Response) => {
  try {
    const { status, employeeId } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.employee = employeeId;
    } else if (req.user?.role !== 'HR_MANAGER') {
      // If not HR manager, only show their own requests
      const employee = await Employee.findOne({ userId: req.user?._id });
      if (employee) {
        query.employee = employee._id;
      }
    }

    const requests = await Overtime.find(query)
      .populate('employee', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overtime requests', error });
  }
};

export const updateOvertimeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const overtime = await Overtime.findById(id);
    if (!overtime) {
      return res.status(404).json({ message: 'Overtime request not found' });
    }

    overtime.status = status;
    overtime.approvedBy = status === 'approved' ? userId : undefined;
    overtime.approvedAt = status === 'approved' ? new Date() : undefined;
    overtime.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
    overtime.updatedBy = userId as Types.ObjectId;

    await overtime.save();

    // Create notification for employee
    await Notification.create({
      recipient: overtime.employee,
      type: `overtime_${status}`,
      title: `Overtime Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your overtime request for ${overtime.date} has been ${status}`,
      metadata: {
        overtimeId: overtime._id,
      },
    });

    res.json(overtime);
  } catch (error) {
    res.status(500).json({ message: 'Error updating overtime status', error });
  }
}; 