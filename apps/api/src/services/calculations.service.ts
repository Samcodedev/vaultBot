import { SAVING_TYPE } from '../utils';

export const calculateNextDebitDate = (
  type: (typeof SAVING_TYPE)[number],
  scheduleTime: string,
  startDate: Date = new Date(),
): Date => {
  const timeMatch = scheduleTime.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!timeMatch) return new Date(NaN);

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3]?.toUpperCase();

  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }

  const nextDate = new Date(startDate);
  nextDate.setHours(hours, minutes, 0, 0);

  // If the calculated time for today has already passed, move to the next interval
  if (nextDate <= startDate) {
    switch (type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
  }

  return nextDate;
};
