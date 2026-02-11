const leaveService = require('../services/leave.service');
const exportService = require('../services/exportService');
const catchAsync = require('../utils/catchAsync');

const createLeave = catchAsync(async (req, res) => {
  const leave = await leaveService.createLeave(req.user.id, req.validated.body);
  res.status(201).json({
    success: true,
    data: leave,
    message: 'Leave request submitted successfully',
  });
});

const getMyLeaves = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await leaveService.getMyLeaves(req.user.id, {
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  res.json({ success: true, ...result });
});

const getTeamLeaves = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await leaveService.getTeamLeaves(req.user, {
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  res.json({ success: true, ...result });
});

const getAllLeaves = catchAsync(async (req, res) => {
  const { status, leaveTypeId, departmentId, startDate, endDate, page, limit } = req.query;
  const result = await leaveService.getAllLeaves({
    status,
    leaveTypeId,
    departmentId,
    startDate,
    endDate,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  res.json({ success: true, ...result });
});

const getLeaveById = catchAsync(async (req, res) => {
  const leave = await leaveService.getLeaveById(req.params.id, req.user);
  res.json({ success: true, data: leave });
});

const updateLeaveStatus = catchAsync(async (req, res) => {
  const leave = await leaveService.updateLeaveStatus(
    req.params.id,
    req.user.id,
    req.validated.body
  );
  res.json({
    success: true,
    data: leave,
    message: `Leave ${req.validated.body.status} successfully`,
  });
});

const cancelLeave = catchAsync(async (req, res) => {
  const leave = await leaveService.cancelLeave(req.params.id, req.user.id);
  res.json({
    success: true,
    data: leave,
    message: 'Leave cancelled successfully',
  });
});

const deleteLeave = catchAsync(async (req, res) => {
  await leaveService.deleteLeave(req.params.id);
  res.json({
    success: true,
    message: 'Leave deleted successfully',
  });
});

const getCalendarLeaves = catchAsync(async (req, res) => {
  const { startDate, endDate, departmentId } = req.query;
  const leaves = await leaveService.getCalendarLeaves(req.user, {
    startDate,
    endDate,
    departmentId,
  });
  res.json({ success: true, data: leaves });
});

const exportLeaves = catchAsync(async (req, res) => {
  const { format, status, leaveTypeId, departmentId, startDate, endDate } = req.query;

  // Get leaves based on filters
  const result = await leaveService.getAllLeaves({
    status,
    leaveTypeId,
    departmentId,
    startDate,
    endDate,
    page: 1,
    limit: 5000,
  });

  if (result.data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No data to export',
    });
  }

  if (result.pagination && result.pagination.total > 5000) {
    res.setHeader('X-Truncated', 'true');
    res.setHeader('X-Total-Records', result.pagination.total.toString());
  }

  if (format === 'csv') {
    const csv = exportService.generateLeaveCSV(result.data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leaves.csv');
    return res.send(csv);
  } else if (format === 'pdf') {
    const metadata = {
      dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      department: departmentId || 'All departments',
    };
    const pdfDoc = exportService.generateLeavePDF(result.data, metadata);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=leaves.pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid format. Use "csv" or "pdf"',
    });
  }
});

const getAnnualReport = catchAsync(async (req, res) => {
  const { userId, year } = req.params;
  const report = await leaveService.getAnnualReport(userId, parseInt(year));
  res.json({ success: true, data: report });
});

const getDepartmentAnalytics = catchAsync(async (req, res) => {
  const { deptId } = req.params;
  const { startDate, endDate } = req.query;
  const analytics = await leaveService.getDepartmentAnalytics(deptId, {
    startDate,
    endDate,
  });
  res.json({ success: true, data: analytics });
});

const getUpcomingLeaves = catchAsync(async (req, res) => {
  const { days } = req.query;
  const leaves = await leaveService.getUpcomingLeaves(req.user, parseInt(days) || 30);
  res.json({ success: true, data: leaves });
});

const getLeaveStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await leaveService.getLeaveStats(req.user, { startDate, endDate });
  res.json({ success: true, data: stats });
});

module.exports = {
  createLeave,
  getMyLeaves,
  getTeamLeaves,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus,
  cancelLeave,
  deleteLeave,
  getCalendarLeaves,
  exportLeaves,
  getAnnualReport,
  getDepartmentAnalytics,
  getUpcomingLeaves,
  getLeaveStats,
};
