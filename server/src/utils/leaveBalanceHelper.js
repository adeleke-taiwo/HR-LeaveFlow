const prisma = require('../config/database');

async function createDefaultLeaveBalances(userId) {
  const currentYear = new Date().getFullYear();
  const leaveTypes = await prisma.leaveType.findMany({ where: { isActive: true } });
  await Promise.all(
    leaveTypes.map((lt) =>
      prisma.leaveBalance.create({
        data: {
          userId,
          leaveTypeId: lt.id,
          year: currentYear,
          allocated: lt.defaultDaysPerYear,
        },
      })
    )
  );
}

module.exports = { createDefaultLeaveBalances };
