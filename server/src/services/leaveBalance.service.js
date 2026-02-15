const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

async function getMyBalances(userId) {
  const currentYear = new Date().getFullYear();
  const balances = await prisma.leaveBalance.findMany({
    where: { userId, year: currentYear },
    include: { leaveType: true },
    orderBy: { leaveType: { name: 'asc' } },
  });

  return balances.map((b) => ({
    ...b,
    remaining: b.allocated - b.used - b.pending,
  }));
}

async function getUserBalances(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const currentYear = new Date().getFullYear();
  const balances = await prisma.leaveBalance.findMany({
    where: { userId, year: currentYear },
    include: { leaveType: true },
    orderBy: { leaveType: { name: 'asc' } },
  });

  return balances.map((b) => ({
    ...b,
    remaining: b.allocated - b.used - b.pending,
  }));
}

async function allocateBalances({ userId, year, allocations }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const results = await Promise.all(
    allocations.map(({ leaveTypeId, allocated }) =>
      prisma.leaveBalance.upsert({
        where: {
          userId_leaveTypeId_year: { userId, leaveTypeId, year },
        },
        update: { allocated },
        create: { userId, leaveTypeId, year, allocated },
        include: { leaveType: true },
      })
    )
  );

  return results;
}

async function adjustBalance(balanceId, { allocated, used, pending }) {
  const balance = await prisma.leaveBalance.findUnique({ where: { id: balanceId } });
  if (!balance) throw new ApiError(404, 'Balance not found');

  const data = {};
  if (allocated !== undefined) data.allocated = allocated;
  if (used !== undefined) data.used = used;
  if (pending !== undefined) data.pending = pending;

  const updated = await prisma.leaveBalance.update({
    where: { id: balanceId },
    data,
    include: { leaveType: true },
  });

  return { ...updated, remaining: updated.allocated - updated.used - updated.pending };
}

module.exports = { getMyBalances, getUserBalances, allocateBalances, adjustBalance };
