import { Request, Response } from 'express';
import { Shift } from '../models/Shift';
import { Types } from 'mongoose';

export const createShift = async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, breakTime, graceTime } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const shift = new Shift({
      name,
      startTime,
      endTime,
      breakTime,
      graceTime,
      createdBy: userId,
      updatedBy: userId,
    });

    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error creating shift', error });
  }
};

export const getShifts = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    const query: any = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const shifts = await Shift.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ name: 1 });

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shifts', error });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, breakTime, graceTime, isActive } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    shift.name = name || shift.name;
    shift.startTime = startTime || shift.startTime;
    shift.endTime = endTime || shift.endTime;
    shift.breakTime = breakTime || shift.breakTime;
    shift.graceTime = graceTime || shift.graceTime;
    shift.isActive = isActive !== undefined ? isActive : shift.isActive;
    shift.updatedBy = userId as Types.ObjectId;

    await shift.save();
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error updating shift', error });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Soft delete by setting isActive to false
    shift.isActive = false;
    shift.updatedBy = userId as Types.ObjectId;
    await shift.save();

    res.json({ message: 'Shift deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shift', error });
  }
}; 