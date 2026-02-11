function calculateBusinessDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
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

function calculateTotalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function calculateLeaveDays(startDate, endDate, leaveTypeName) {
  // Maternity Leave includes weekends (calendar days)
  if (leaveTypeName && leaveTypeName.toLowerCase().includes('maternity')) {
    return calculateTotalDays(startDate, endDate);
  }
  // All other leave types exclude weekends
  return calculateBusinessDays(startDate, endDate);
}

module.exports = { calculateBusinessDays, calculateTotalDays, calculateLeaveDays };
