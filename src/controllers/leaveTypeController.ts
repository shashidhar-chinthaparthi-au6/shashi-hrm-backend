import { Request, Response } from 'express';
import { LeaveType } from '../models/LeaveType';
import { LeaveApplication } from '../models/LeaveApplication';
import { Types } from 'mongoose';

export const createLeaveType = async (req: Request, res: Response) => {
  try {
    const { name, description, defaultDays, isPaid } = req.body;
    const userId = req.user?._id;

    const leaveType = new LeaveType({
      name,
      description,
      defaultDays,
      isPaid,
      createdBy: userId,
      updatedBy: userId,
    });

    await leaveType.save();
    res.status(201).json(leaveType);
  } catch (error) {
    res.status(500).json({ message: 'Error creating leave type', error });
  }
};

export const getLeaveTypes = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    const query: any = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const leaveTypes = await LeaveType.find(query).sort({ name: 1 });
    res.json(leaveTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave types', error });
  }
};

export const updateLeaveType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, defaultDays, isPaid, isActive } = req.body;
    const userId = req.user?._id;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    leaveType.name = name || leaveType.name;
    leaveType.description = description || leaveType.description;
    leaveType.defaultDays = defaultDays !== undefined ? defaultDays : leaveType.defaultDays;
    leaveType.isPaid = isPaid !== undefined ? isPaid : leaveType.isPaid;
    leaveType.isActive = isActive !== undefined ? isActive : leaveType.isActive;
    leaveType.updatedBy = userId as Types.ObjectId;

    await leaveType.save();
    res.json(leaveType);
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave type', error });
  }
};

export const deleteLeaveType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    // Check if leave type is being used
    const leaveApplications = await LeaveApplication.countDocuments({ leaveType: id });
    if (leaveApplications > 0) {
      return res.status(400).json({ message: 'Cannot delete leave type as it is being used' });
    }

    await leaveType.deleteOne();
    res.json({ message: 'Leave type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting leave type', error });
  }
}; 