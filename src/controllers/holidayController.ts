import { Request, Response } from 'express';
import { Holiday } from '../models/Holiday';
import { format, parseISO, isWithinInterval } from 'date-fns';

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query = {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ message: 'Error fetching holidays' });
  }
};

export const createHoliday = async (req: Request, res: Response) => {
  try {
    const { name, date, type, description } = req.body;

    const holiday = new Holiday({
      name,
      date,
      type,
      description,
    });

    await holiday.save();
    res.status(201).json(holiday);
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ message: 'Error creating holiday' });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, date, type, description } = req.body;

    const holiday = await Holiday.findByIdAndUpdate(
      id,
      {
        name,
        date,
        type,
        description,
      },
      { new: true }
    );

    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json(holiday);
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ message: 'Error updating holiday' });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findByIdAndDelete(id);

    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ message: 'Error deleting holiday' });
  }
};

export const checkHoliday = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    const holiday = await Holiday.findOne({ date });

    if (holiday) {
      res.json({ isHoliday: true, holiday });
    } else {
      res.json({ isHoliday: false });
    }
  } catch (error) {
    console.error('Error checking holiday:', error);
    res.status(500).json({ message: 'Error checking holiday' });
  }
};

export const getHolidayCalendar = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const holidays = await Holiday.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: 1 });

    const calendar = Array(12).fill(null).map(() => []);

    holidays.forEach((holiday) => {
      const date = parseISO(holiday.date);
      const month = date.getMonth();
      calendar[month].push({
        date: format(date, 'yyyy-MM-dd'),
        name: holiday.name,
        type: holiday.type,
      });
    });

    res.json(calendar);
  } catch (error) {
    console.error('Error fetching holiday calendar:', error);
    res.status(500).json({ message: 'Error fetching holiday calendar' });
  }
}; 