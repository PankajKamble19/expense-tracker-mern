const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

export const advanceRecurringDate = (value, frequency, anchorValue = value) => {
  const current = new Date(value);
  const anchor = new Date(anchorValue);

  if (Number.isNaN(current.getTime()) || Number.isNaN(anchor.getTime())) {
    throw new TypeError('A valid recurrence date is required');
  }

  const next = new Date(current);

  if (frequency === 'Daily') {
    next.setDate(next.getDate() + 1);
  } else if (frequency === 'Weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'Monthly') {
    const targetMonth = next.getMonth() + 1;
    const targetYear = next.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    const targetDay = Math.min(anchor.getDate(), daysInMonth(targetYear, normalizedMonth));
    next.setFullYear(targetYear, normalizedMonth, targetDay);
  } else if (frequency === 'Yearly') {
    const targetYear = next.getFullYear() + 1;
    const targetMonth = anchor.getMonth();
    const targetDay = Math.min(anchor.getDate(), daysInMonth(targetYear, targetMonth));
    next.setFullYear(targetYear, targetMonth, targetDay);
  } else {
    throw new TypeError('Unsupported recurrence frequency');
  }

  return next;
};
