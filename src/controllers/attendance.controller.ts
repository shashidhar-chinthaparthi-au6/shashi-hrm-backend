import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { format } from 'date-fns';

export const attendanceController = {
  async getDailyAttendance(req: Request, res: Response) {
    try {
      const date = new Date(req.params.date);
      const records = await attendanceService.getDailyAttendance(date);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAttendanceReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const records = await attendanceService.getAttendanceReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      // Calculate summary
      const summary = {
        total: records.length,
        present: records.filter(a => a.status === 'present').length,
        absent: records.filter(a => a.status === 'absent').length,
        late: records.filter(a => a.status === 'late').length,
        halfDay: records.filter(a => a.status === 'half-day').length,
      };

      res.json({
        records,
        summary
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateAttendanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { checkIn, checkOut, status, notes } = req.body;

      // Format time strings if provided
      const formattedCheckIn = checkIn ? format(new Date(checkIn), 'HH:mm') : undefined;
      const formattedCheckOut = checkOut ? format(new Date(checkOut), 'HH:mm') : undefined;

      const record = await attendanceService.updateAttendanceRecord(id, {
        ...(formattedCheckIn && { checkIn: formattedCheckIn }),
        ...(formattedCheckOut && { checkOut: formattedCheckOut }),
        ...(status && { status }),
        ...(notes && { notes })
      });

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async getSettings(req: Request, res: Response) {
    try {
      const settings = await attendanceService.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const settings = await attendanceService.updateSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async downloadReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const workbook = await attendanceService.generateExcelReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=attendance-report-${startDate}-to-${endDate}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}; 