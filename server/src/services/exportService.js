const { stringify } = require('csv-stringify/sync');
const PDFDocument = require('pdfkit');
const { format } = require('date-fns');

class ExportService {
  /**
   * Generate CSV from leaves array
   * @param {Array} leaves - Array of leave records
   * @returns {String} CSV string
   */
  generateLeaveCSV(leaves) {
    const records = leaves.map(leave => ({
      'Leave ID': leave.id,
      'Employee': `${leave.requester.firstName} ${leave.requester.lastName}`,
      'Email': leave.requester.email,
      'Department': leave.requester.department?.name || 'N/A',
      'Leave Type': leave.leaveType.name,
      'Start Date': format(new Date(leave.startDate), 'yyyy-MM-dd'),
      'End Date': format(new Date(leave.endDate), 'yyyy-MM-dd'),
      'Total Days': leave.totalDays,
      'Status': leave.status,
      'Reason': leave.reason,
      'Reviewer': leave.reviewer ? `${leave.reviewer.firstName} ${leave.reviewer.lastName}` : 'N/A',
      'Review Comment': leave.reviewComment || 'N/A',
      'Requested On': format(new Date(leave.createdAt), 'yyyy-MM-dd HH:mm'),
      'Reviewed On': leave.reviewedAt ? format(new Date(leave.reviewedAt), 'yyyy-MM-dd HH:mm') : 'N/A'
    }));

    return stringify(records, {
      header: true,
      columns: Object.keys(records[0] || {})
    });
  }

  /**
   * Generate PDF report from leaves array
   * @param {Array} leaves - Array of leave records
   * @param {Object} metadata - Report metadata (title, date range, etc.)
   * @returns {PDFDocument} PDF document stream
   */
  generateLeavePDF(leaves, metadata = {}) {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });

    // Header
    doc.fontSize(20).text('Leave Report', { align: 'center' });
    doc.moveDown(0.5);

    if (metadata.dateRange) {
      doc.fontSize(10).text(`Period: ${metadata.dateRange}`, { align: 'center' });
    }

    if (metadata.department) {
      doc.fontSize(10).text(`Department: ${metadata.department}`, { align: 'center' });
    }

    doc.fontSize(8).text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, { align: 'right' });
    doc.moveDown(1);

    // Summary stats
    const approved = leaves.filter(l => l.status === 'approved').length;
    const pending = leaves.filter(l => l.status === 'pending').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;
    const totalDays = leaves.reduce((sum, l) => sum + l.totalDays, 0);

    doc.fontSize(10).text(`Total Leaves: ${leaves.length}`, { continued: true }).text(`    Total Days: ${totalDays}`, { align: 'left' });
    doc.text(`Approved: ${approved}    Pending: ${pending}    Rejected: ${rejected}`);
    doc.moveDown(1);

    // Table headers
    doc.fontSize(8);
    const startX = 50;
    let startY = doc.y;

    const colWidths = {
      employee: 100,
      leaveType: 80,
      dates: 120,
      days: 30,
      status: 60,
      reason: 100
    };

    // Draw table header
    doc.font('Helvetica-Bold');
    doc.text('Employee', startX, startY, { width: colWidths.employee, continued: true })
       .text('Leave Type', { width: colWidths.leaveType, continued: true })
       .text('Dates', { width: colWidths.dates, continued: true })
       .text('Days', { width: colWidths.days, continued: true })
       .text('Status', { width: colWidths.status, continued: true })
       .text('Reason', { width: colWidths.reason });

    doc.moveDown(0.5);

    // Draw table rows
    doc.font('Helvetica');
    leaves.forEach((leave, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        startY = 50;
        doc.y = startY;
      }

      const employeeName = `${leave.requester.firstName} ${leave.requester.lastName}`;
      const dates = `${format(new Date(leave.startDate), 'MM/dd')} - ${format(new Date(leave.endDate), 'MM/dd')}`;
      const reason = leave.reason.length > 40 ? leave.reason.substring(0, 37) + '...' : leave.reason;

      doc.text(employeeName, startX, doc.y, { width: colWidths.employee, continued: true })
         .text(leave.leaveType.name, { width: colWidths.leaveType, continued: true })
         .text(dates, { width: colWidths.dates, continued: true })
         .text(leave.totalDays.toString(), { width: colWidths.days, continued: true })
         .text(leave.status, { width: colWidths.status, continued: true })
         .text(reason, { width: colWidths.reason });

      doc.moveDown(0.3);
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(
        `Page ${i + 1} of ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }

    return doc;
  }

  /**
   * Generate annual report for an employee
   * @param {Object} data - Leave data and balance info
   * @returns {Object} Structured report data
   */
  generateAnnualReport(data) {
    const { leaves, balances, user, year } = data;

    // Group leaves by type
    const leavesByType = {};
    leaves.forEach(leave => {
      if (!leavesByType[leave.leaveType.name]) {
        leavesByType[leave.leaveType.name] = {
          totalDays: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          leaves: []
        };
      }

      leavesByType[leave.leaveType.name].totalDays += leave.totalDays;
      leavesByType[leave.leaveType.name][leave.status]++;
      leavesByType[leave.leaveType.name].leaves.push({
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.totalDays,
        status: leave.status,
        reason: leave.reason
      });
    });

    // Calculate balance information
    const balanceInfo = balances.map(balance => ({
      leaveType: balance.leaveType.name,
      allocated: balance.allocated,
      used: balance.used,
      pending: balance.pending,
      available: balance.allocated - balance.used - balance.pending
    }));

    return {
      employee: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        department: user.department?.name || 'N/A'
      },
      year,
      summary: {
        totalLeavesRequested: leaves.length,
        totalDaysTaken: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.totalDays, 0),
        totalDaysPending: leaves.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.totalDays, 0)
      },
      leavesByType,
      balances: balanceInfo
    };
  }

  /**
   * Generate department analytics
   * @param {Object} data - Department data
   * @returns {Object} Analytics data
   */
  generateDepartmentAnalytics(data) {
    const { leaves, department, dateRange } = data;

    // Calculate monthly trends
    const monthlyTrends = {};
    leaves.forEach(leave => {
      const month = format(new Date(leave.startDate), 'yyyy-MM');
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { approved: 0, pending: 0, rejected: 0, totalDays: 0 };
      }
      monthlyTrends[month][leave.status]++;
      monthlyTrends[month].totalDays += leave.totalDays;
    });

    // Leave type distribution
    const typeDistribution = {};
    leaves.forEach(leave => {
      if (!typeDistribution[leave.leaveType.name]) {
        typeDistribution[leave.leaveType.name] = 0;
      }
      typeDistribution[leave.leaveType.name] += leave.totalDays;
    });

    // Employee utilization
    const employeeUtilization = {};
    leaves.forEach(leave => {
      const empName = `${leave.requester.firstName} ${leave.requester.lastName}`;
      if (!employeeUtilization[empName]) {
        employeeUtilization[empName] = { approved: 0, pending: 0, rejected: 0 };
      }
      if (leave.status === 'approved') {
        employeeUtilization[empName].approved += leave.totalDays;
      } else if (leave.status === 'pending') {
        employeeUtilization[empName].pending += leave.totalDays;
      } else if (leave.status === 'rejected') {
        employeeUtilization[empName].rejected += leave.totalDays;
      }
    });

    return {
      department: department.name,
      dateRange,
      summary: {
        totalLeaves: leaves.length,
        totalDays: leaves.reduce((sum, l) => sum + l.totalDays, 0),
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length
      },
      monthlyTrends,
      typeDistribution,
      employeeUtilization
    };
  }
}

module.exports = new ExportService();
