const prisma = require('../config/database');
const ApiError = require('../utils/apiError');
const { calculateLeaveDays } = require('../utils/dateUtils');
const { LEAVE_STATUS, ROLES } = require('../utils/constants');
const workflowService = require('./workflowService');

async function createLeave(userId, { leaveTypeId, startDate, endDate, reason }) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    throw new ApiError(400, 'End date must be on or after start date');
  }

  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType || !leaveType.isActive) {
    throw new ApiError(404, 'Leave type not found or inactive');
  }

  const totalDays = calculateLeaveDays(start, end, leaveType.name);
  const currentYear = start.getFullYear();

  // All checks + insert inside a single transaction to prevent race conditions
  const leave = await prisma.$transaction(async (tx) => {
    // Check leave balance atomically
    const balance = await tx.leaveBalance.findUnique({
      where: {
        userId_leaveTypeId_year: { userId, leaveTypeId, year: currentYear },
      },
    });

    if (balance) {
      const available = balance.allocated - balance.used - balance.pending;
      if (totalDays > available) {
        throw new ApiError(400, `Insufficient leave balance. Available: ${available} days, Requested: ${totalDays} days`);
      }
    }

    // Check for overlapping leaves atomically
    const overlapping = await tx.leave.findFirst({
      where: {
        requesterId: userId,
        status: { in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (overlapping) {
      throw new ApiError(400, 'You already have a leave request overlapping with these dates');
    }

    const newLeave = await tx.leave.create({
      data: {
        requesterId: userId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
      },
      include: {
        requester: { include: { department: true } },
        leaveType: true,
      },
    });

    // Update pending balance
    if (balance) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { increment: totalDays } },
      });
    }

    return newLeave;
  });

  return sanitizeLeave(leave);
}

async function getMyLeaves(userId, { status, page = 1, limit = 20 }) {
  const where = { requesterId: userId };
  if (status) where.status = status;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: { leaveType: true, reviewer: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leave.count({ where }),
  ]);

  return {
    data: leaves.map(sanitizeLeave),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getTeamLeaves(user, { status, page = 1, limit = 20 }) {
  const where = {};
  if (status) where.status = status;

  // Manager sees only their department; admin sees all
  if (user.role === ROLES.MANAGER) {
    where.requester = { departmentId: user.departmentId };
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        requester: { include: { department: true } },
        leaveType: true,
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leave.count({ where }),
  ]);

  return {
    data: leaves.map(sanitizeLeave),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getAllLeaves({ status, leaveTypeId, departmentId, startDate, endDate, page = 1, limit = 20 }) {
  const where = {};
  if (status) where.status = status;
  if (leaveTypeId) where.leaveTypeId = leaveTypeId;
  if (departmentId) where.requester = { departmentId };
  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate);
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        requester: { include: { department: true } },
        leaveType: true,
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leave.count({ where }),
  ]);

  return {
    data: leaves.map(sanitizeLeave),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getLeaveById(leaveId, user) {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
    include: {
      requester: { include: { department: true } },
      leaveType: true,
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!leave) throw new ApiError(404, 'Leave not found');

  // Check access: owner, manager of same department, or admin
  if (
    leave.requesterId !== user.id &&
    user.role === ROLES.EMPLOYEE
  ) {
    throw new ApiError(403, 'You do not have permission to view this leave');
  }

  if (
    user.role === ROLES.MANAGER &&
    leave.requester.departmentId !== user.departmentId &&
    leave.requesterId !== user.id
  ) {
    throw new ApiError(403, 'You can only view leaves from your department');
  }

  return sanitizeLeave(leave);
}

async function updateLeaveStatus(leaveId, reviewerId, { status, reviewComment }) {
  // All reads + guards + writes inside a single transaction to prevent double-approval
  const updated = await prisma.$transaction(async (tx) => {
    const leave = await tx.leave.findUnique({
      where: { id: leaveId },
      include: { requester: true, leaveType: true },
    });

    if (!leave) throw new ApiError(404, 'Leave not found');

    // Allow approval of pending or pending_hr leaves
    if (![LEAVE_STATUS.PENDING, LEAVE_STATUS.PENDING_HR].includes(leave.status)) {
      throw new ApiError(400, 'Only pending leaves can be approved or rejected');
    }

    const reviewer = await tx.user.findUnique({ where: { id: reviewerId } });

    // Manager can only approve/reject within their department
    if (reviewer.role === ROLES.MANAGER && leave.requester.departmentId !== reviewer.departmentId) {
      throw new ApiError(403, 'You can only manage leaves from your department');
    }

    // Check if HR approval is required
    const requiresHR = await workflowService.requiresHRApproval(leave.leaveTypeId, leave.totalDays);
    let updateData = {};
    let finalStatus = status;

    // Multi-step approval logic
    if (reviewer.role === ROLES.MANAGER && leave.status === LEAVE_STATUS.PENDING) {
      // Manager is reviewing a pending leave
      if (status === LEAVE_STATUS.REJECTED) {
        // Manager rejection is final
        updateData = {
          status: LEAVE_STATUS.REJECTED,
          managerReviewerId: reviewerId,
          managerReviewedAt: new Date(),
          managerComment: reviewComment,
          reviewerId,
          reviewComment,
          reviewedAt: new Date(),
          currentApprovalStep: 'completed',
        };
      } else if (status === LEAVE_STATUS.APPROVED) {
        if (requiresHR) {
          // Manager approves, but needs HR approval
          finalStatus = LEAVE_STATUS.PENDING_HR;
          updateData = {
            status: LEAVE_STATUS.PENDING_HR,
            managerReviewerId: reviewerId,
            managerReviewedAt: new Date(),
            managerComment: reviewComment,
            currentApprovalStep: 'hr',
          };
        } else {
          // Manager approval is final
          updateData = {
            status: LEAVE_STATUS.APPROVED,
            managerReviewerId: reviewerId,
            managerReviewedAt: new Date(),
            managerComment: reviewComment,
            reviewerId,
            reviewComment,
            reviewedAt: new Date(),
            currentApprovalStep: 'completed',
          };
        }
      }
    } else if (reviewer.role === ROLES.ADMIN && leave.status === LEAVE_STATUS.PENDING_HR) {
      // Admin/HR is reviewing a pending_hr leave
      updateData = {
        status: status, // Approved or Rejected
        hrReviewerId: reviewerId,
        hrReviewedAt: new Date(),
        hrComment: reviewComment,
        reviewerId,
        reviewComment,
        reviewedAt: new Date(),
        currentApprovalStep: 'completed',
      };
    } else if (reviewer.role === ROLES.ADMIN && leave.status === LEAVE_STATUS.PENDING) {
      // Admin directly approving/rejecting (bypassing manager step)
      updateData = {
        status: status,
        reviewerId,
        reviewComment,
        reviewedAt: new Date(),
        currentApprovalStep: 'completed',
      };
    } else {
      throw new ApiError(403, 'You do not have permission to review this leave at this stage');
    }

    const updatedLeave = await tx.leave.update({
      where: { id: leaveId },
      data: updateData,
      include: {
        requester: { include: { department: true } },
        leaveType: true,
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        managerReviewer: { select: { id: true, firstName: true, lastName: true } },
        hrReviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update leave balance
    const year = new Date(leave.startDate).getFullYear();
    const balance = await tx.leaveBalance.findUnique({
      where: {
        userId_leaveTypeId_year: {
          userId: leave.requesterId,
          leaveTypeId: leave.leaveTypeId,
          year,
        },
      },
    });

    if (balance) {
      if (finalStatus === LEAVE_STATUS.APPROVED) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pending: { decrement: leave.totalDays },
            used: { increment: leave.totalDays },
          },
        });
      } else if (finalStatus === LEAVE_STATUS.REJECTED) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { pending: { decrement: leave.totalDays } },
        });
      }
      // PENDING_HR doesn't change balance yet
    }

    return updatedLeave;
  });

  return sanitizeLeave(updated);
}

async function cancelLeave(leaveId, userId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });

  if (!leave) throw new ApiError(404, 'Leave not found');
  if (leave.requesterId !== userId) {
    throw new ApiError(403, 'You can only cancel your own leaves');
  }
  if (leave.status !== LEAVE_STATUS.PENDING) {
    throw new ApiError(400, 'Only pending leaves can be cancelled');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedLeave = await tx.leave.update({
      where: { id: leaveId },
      data: { status: LEAVE_STATUS.CANCELLED },
      include: {
        requester: { include: { department: true } },
        leaveType: true,
      },
    });

    // Restore pending balance
    const year = new Date(leave.startDate).getFullYear();
    const balance = await tx.leaveBalance.findUnique({
      where: {
        userId_leaveTypeId_year: {
          userId: leave.requesterId,
          leaveTypeId: leave.leaveTypeId,
          year,
        },
      },
    });

    if (balance) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { decrement: leave.totalDays } },
      });
    }

    return updatedLeave;
  });

  return sanitizeLeave(updated);
}

async function deleteLeave(leaveId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave) throw new ApiError(404, 'Leave not found');

  await prisma.$transaction(async (tx) => {
    // Restore balance if pending or approved
    if (leave.status === LEAVE_STATUS.PENDING || leave.status === LEAVE_STATUS.APPROVED) {
      const year = new Date(leave.startDate).getFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: {
          userId_leaveTypeId_year: {
            userId: leave.requesterId,
            leaveTypeId: leave.leaveTypeId,
            year,
          },
        },
      });

      if (balance) {
        const update = {};
        if (leave.status === LEAVE_STATUS.PENDING) {
          update.pending = { decrement: leave.totalDays };
        } else {
          update.used = { decrement: leave.totalDays };
        }
        await tx.leaveBalance.update({ where: { id: balance.id }, data: update });
      }
    }

    await tx.leave.delete({ where: { id: leaveId } });
  });
}

async function getCalendarLeaves(user, { startDate, endDate, departmentId }) {
  const where = {
    status: LEAVE_STATUS.APPROVED,
    OR: [
      { startDate: { gte: new Date(startDate), lte: new Date(endDate) } },
      { endDate: { gte: new Date(startDate), lte: new Date(endDate) } },
      { AND: [{ startDate: { lte: new Date(startDate) } }, { endDate: { gte: new Date(endDate) } }] },
    ],
  };

  // Manager sees only their department; admin sees all or filtered department
  if (user.role === ROLES.MANAGER) {
    where.requester = { departmentId: user.departmentId };
  } else if (departmentId) {
    where.requester = { departmentId };
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, department: true } },
      leaveType: true,
    },
    orderBy: { startDate: 'asc' },
  });

  return leaves.map(sanitizeLeave);
}

async function getUpcomingLeaves(user, days = 30) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const where = {
    status: LEAVE_STATUS.APPROVED,
    startDate: { gte: startDate, lte: endDate },
  };

  // Role-based filtering
  if (user.role === ROLES.MANAGER) {
    where.requester = { departmentId: user.departmentId };
  } else if (user.role === ROLES.EMPLOYEE) {
    where.requesterId = user.id;
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      requester: { select: { id: true, firstName: true, lastName: true, department: true } },
      leaveType: true,
    },
    orderBy: { startDate: 'asc' },
    take: 10,
  });

  return leaves.map(sanitizeLeave);
}

async function getLeaveStats(user, dateRange = {}) {
  const { startDate, endDate } = dateRange;

  const where = {};
  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate);
  } else {
    // Default to last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    where.startDate = { gte: sixMonthsAgo };
  }

  // Role-based filtering
  if (user.role === ROLES.MANAGER) {
    where.requester = { departmentId: user.departmentId };
  } else if (user.role === ROLES.EMPLOYEE) {
    where.requesterId = user.id;
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      leaveType: true,
    },
  });

  // Calculate stats
  const stats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === LEAVE_STATUS.APPROVED).length,
    pending: leaves.filter(l => l.status === LEAVE_STATUS.PENDING).length,
    rejected: leaves.filter(l => l.status === LEAVE_STATUS.REJECTED).length,
    pendingHR: leaves.filter(l => l.status === LEAVE_STATUS.PENDING_HR).length,
    totalDays: leaves.filter(l => l.status === LEAVE_STATUS.APPROVED).reduce((sum, l) => sum + l.totalDays, 0),
    byType: {},
    byMonth: {},
  };

  // Group by leave type
  leaves.forEach(leave => {
    const typeName = leave.leaveType.name;
    if (!stats.byType[typeName]) {
      stats.byType[typeName] = { count: 0, days: 0 };
    }
    stats.byType[typeName].count++;
    if (leave.status === LEAVE_STATUS.APPROVED) {
      stats.byType[typeName].days += leave.totalDays;
    }
  });

  // Group by month
  leaves.forEach(leave => {
    const monthYear = new Date(leave.startDate).toISOString().substring(0, 7); // YYYY-MM
    if (!stats.byMonth[monthYear]) {
      stats.byMonth[monthYear] = { approved: 0, pending: 0, rejected: 0, totalDays: 0 };
    }
    if (leave.status === LEAVE_STATUS.APPROVED) {
      stats.byMonth[monthYear].approved++;
      stats.byMonth[monthYear].totalDays += leave.totalDays;
    } else if (leave.status === LEAVE_STATUS.PENDING || leave.status === LEAVE_STATUS.PENDING_HR) {
      stats.byMonth[monthYear].pending++;
    } else if (leave.status === LEAVE_STATUS.REJECTED) {
      stats.byMonth[monthYear].rejected++;
    }
  });

  return stats;
}

async function getAnnualReport(userId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const [user, leaves, balances] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    }),
    prisma.leave.findMany({
      where: {
        requesterId: userId,
        startDate: { gte: startDate, lte: endDate },
      },
      include: { leaveType: true },
      orderBy: { startDate: 'asc' },
    }),
    prisma.leaveBalance.findMany({
      where: { userId, year },
      include: { leaveType: true },
    }),
  ]);

  if (!user) throw new ApiError(404, 'User not found');

  const exportService = require('./exportService');
  return exportService.generateAnnualReport({ leaves, balances, user, year });
}

async function getDepartmentAnalytics(departmentId, dateRange = {}) {
  const { startDate, endDate } = dateRange;

  const where = {
    requester: { departmentId },
  };

  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate);
  } else {
    // Default to last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    where.startDate = { gte: oneYearAgo };
  }

  const [department, leaves] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId } }),
    prisma.leave.findMany({
      where,
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        leaveType: true,
      },
      orderBy: { startDate: 'asc' },
    }),
  ]);

  if (!department) throw new ApiError(404, 'Department not found');

  const exportService = require('./exportService');
  return exportService.generateDepartmentAnalytics({
    department,
    leaves,
    dateRange: dateRange.startDate && dateRange.endDate
      ? `${dateRange.startDate} to ${dateRange.endDate}`
      : 'Last 12 months',
  });
}

function sanitizeLeave(leave) {
  if (leave.requester) {
    const { passwordHash, ...safeRequester } = leave.requester;
    leave.requester = safeRequester;
  }
  if (leave.managerReviewer) {
    const { passwordHash, ...safeReviewer } = leave.managerReviewer;
    leave.managerReviewer = safeReviewer;
  }
  if (leave.hrReviewer) {
    const { passwordHash, ...safeReviewer } = leave.hrReviewer;
    leave.hrReviewer = safeReviewer;
  }
  return leave;
}

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
  getUpcomingLeaves,
  getLeaveStats,
  getAnnualReport,
  getDepartmentAnalytics,
};
