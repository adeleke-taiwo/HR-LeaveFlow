import { format, differenceInCalendarDays } from 'date-fns';

export function formatDate(date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateInput(date) {
  return format(new Date(date), 'yyyy-MM-dd');
}

export function calculateDays(startDate, endDate, leaveTypeName) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Maternity Leave counts all calendar days (including weekends)
  if (leaveTypeName && leaveTypeName.toLowerCase().includes('maternity')) {
    return differenceInCalendarDays(end, start) + 1;
  }

  // All other leave types count business days only
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
