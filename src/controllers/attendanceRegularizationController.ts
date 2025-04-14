import { Request, Response } from 'express';
import { AttendanceRegularization } from '../models/AttendanceRegularization';
import { Employee } from '../models/Employee';
import { Notification } from '../models/Notification';

// Apply for attendance regularization (Employee)
export const applyForRegularization = async (req: Request, res: Response) => {
  try {
    const { date, checkIn, checkOut, reason } = req.body;
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const regularization = new AttendanceRegularization({
      employee: employeeId,
      date,
      checkIn,
      checkOut,
      reason,
    });

    await regularization.save();

    // Create notification for HR
    const hrEmployees = await Employee.find({ role: 'HR_MANAGER' });
    for (const hr of hrEmployees) {
      await Notification.create({
        recipient: hr._id,
        type: 'regularization_pending',
        title: 'New Attendance Regularization Request',
        message: `Employee ${req.user?.firstName} has requested attendance regularization for ${date}`,
        metadata: {
          regularizationId: regularization._id,
        },
      });
    }

    res.status(201).json(regularization);
  } catch (error) {
    res.status(500).json({ message: 'Error applying for regularization' });
  }
};

// Get regularization requests (HR Manager)
export const getRegularizationRequests = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'HR_MANAGER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await AttendanceRegularization.find()
      .populate('employee', 'name employeeId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching regularization requests' });
  }
};

// Update regularization status (HR Manager)
export const updateRegularizationStatus = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'HR_MANAGER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const regularization = await AttendanceRegularization.findById(id);
    if (!regularization) {
      return res.status(404).json({ message: 'Regularization request not found' });
    }

    regularization.status = status;
    regularization.approvedBy = req.user.id;
    regularization.approvedAt = new Date();
    if (status === 'rejected') {
      regularization.rejectionReason = rejectionReason;
    }

    await regularization.save();

    // Create notification for employee
    await Notification.create({
      recipient: regularization.employee,
      type: `regularization_${status}`,
      title: `Attendance Regularization ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your attendance regularization request for ${regularization.date} has been ${status}`,
      metadata: {
        regularizationId: regularization._id,
      },
    });

    res.json(regularization);
  } catch (error) {
    res.status(500).json({ message: 'Error updating regularization status' });
  }
}; 