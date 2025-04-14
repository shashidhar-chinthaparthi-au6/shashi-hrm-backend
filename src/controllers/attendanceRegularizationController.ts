import { Request, Response } from 'express';
import { AttendanceRegularization } from '../models/AttendanceRegularization';
import { Employee } from '../models/Employee';
import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

export const applyForRegularization = async (req: Request, res: Response) => {
  try {
    const { date, checkIn, checkOut, reason } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find employee by userId
    const employee = await Employee.findOne({ userId: new Types.ObjectId(userId) });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const regularization = new AttendanceRegularization({
      employee: employee._id,
      date: new Date(date),
      checkIn: new Date(`${date}T${checkIn}`),
      checkOut: new Date(`${date}T${checkOut}`),
      reason,
      createdBy: userId,
      updatedBy: userId,
    });

    await regularization.save();

    // Create notification for approvers
    const notification = new Notification({
      recipient: userId,
      type: 'regularization',
      title: 'Attendance Regularization Request',
      message: `Your attendance regularization request for ${date} has been submitted.`,
      data: { regularizationId: regularization._id },
      createdBy: userId,
      updatedBy: userId,
    });

    await notification.save();

    res.status(201).json(regularization);
  } catch (error) {
    res.status(500).json({ message: 'Error applying for regularization', error });
  }
};

export const getRegularizationRequests = async (req: Request, res: Response) => {
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

    const regularizations = await AttendanceRegularization.find(query)
      .populate('employee', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(regularizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching regularization requests', error });
  }
};

export const updateRegularizationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const userId = req.user?._id;

    const regularization = await AttendanceRegularization.findById(id);
    if (!regularization) {
      return res.status(404).json({ message: 'Regularization request not found' });
    }

    if (regularization.status !== 'pending') {
      return res.status(400).json({ message: 'Regularization request is not pending' });
    }

    regularization.status = status;
    regularization.approvedBy = status === 'approved' ? userId : undefined;
    regularization.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
    regularization.updatedBy = userId as Types.ObjectId;

    await regularization.save();

    // Create notification for employee
    const notification = new Notification({
      recipient: regularization.employee,
      type: 'regularization',
      title: 'Attendance Regularization Status Update',
      message: `Your attendance regularization request for ${regularization.date} has been ${status}.`,
      data: { regularizationId: regularization._id },
      createdBy: userId,
      updatedBy: userId,
    });

    await notification.save();

    res.json(regularization);
  } catch (error) {
    res.status(500).json({ message: 'Error updating regularization status', error });
  }
}; 