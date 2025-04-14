import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { type, read, limit = 20, page = 1 } = req.query;
    const userId = req.user?._id;

    const query: any = { recipient: userId };
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true, updatedBy: userId as Types.ObjectId },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, updatedBy: userId as Types.ObjectId }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read', error });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const notification = await Notification.findOneAndDelete({ _id: id, recipient: userId });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error });
  }
}; 