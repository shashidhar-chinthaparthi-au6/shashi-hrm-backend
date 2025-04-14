import { Request, Response } from 'express';
import { LeavePolicy } from '../models/LeavePolicy';
import { LeaveType } from '../models/LeaveType';
import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

export const createLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { name, description, leaveTypes, approvalHierarchy, notificationSettings } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate leave types
    for (const lt of leaveTypes) {
      const leaveType = await LeaveType.findById(lt.leaveType);
      if (!leaveType) {
        return res.status(400).json({ message: `Leave type ${lt.leaveType} not found` });
      }
    }

    const policy = new LeavePolicy({
      name,
      description,
      leaveTypes,
      approvalHierarchy,
      notificationSettings,
      createdBy: userId,
      updatedBy: userId,
    });

    await policy.save();

    // Create notification for all users
    const notification = new Notification({
      recipient: userId,
      type: 'system',
      title: 'New Leave Policy',
      message: `A new leave policy "${name}" has been created.`,
      data: { policyId: policy._id },
      createdBy: userId,
      updatedBy: userId,
    });

    await notification.save();

    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error creating leave policy', error });
  }
};

export const getLeavePolicies = async (req: Request, res: Response) => {
  try {
    const policies = await LeavePolicy.find()
      .populate('leaveTypes.leaveType', 'name description')
      .sort({ createdAt: -1 });

    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave policies', error });
  }
};

export const updateLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, leaveTypes, approvalHierarchy, notificationSettings } = req.body;
    const userId = req.user?._id;

    // Validate leave types
    for (const lt of leaveTypes) {
      const leaveType = await LeaveType.findById(lt.leaveType);
      if (!leaveType) {
        return res.status(400).json({ message: `Leave type ${lt.leaveType} not found` });
      }
    }

    const policy = await LeavePolicy.findByIdAndUpdate(
      id,
      {
        name,
        description,
        leaveTypes,
        approvalHierarchy,
        notificationSettings,
        updatedBy: userId,
      },
      { new: true }
    );

    if (!policy) {
      return res.status(404).json({ message: 'Leave policy not found' });
    }

    // Create notification for all users
    const notification = new Notification({
      recipient: userId,
      type: 'system',
      title: 'Leave Policy Updated',
      message: `The leave policy "${name}" has been updated.`,
      data: { policyId: policy._id },
      createdBy: userId,
      updatedBy: userId,
    });

    await notification.save();

    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave policy', error });
  }
};

export const deleteLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const policy = await LeavePolicy.findByIdAndDelete(id);
    if (!policy) {
      return res.status(404).json({ message: 'Leave policy not found' });
    }

    // Create notification for all users
    const notification = new Notification({
      recipient: userId,
      type: 'system',
      title: 'Leave Policy Deleted',
      message: `The leave policy "${policy.name}" has been deleted.`,
      data: { policyId: policy._id },
      createdBy: userId,
      updatedBy: userId,
    });

    await notification.save();

    res.json({ message: 'Leave policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting leave policy', error });
  }
}; 