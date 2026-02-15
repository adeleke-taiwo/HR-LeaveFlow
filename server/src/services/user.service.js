const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const { createDefaultLeaveBalances } = require('../utils/leaveBalanceHelper');

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function getUsers({ page = 1, limit = 20, departmentId, role, search }) {
  const where = {};
  if (departmentId) where.departmentId = departmentId;
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { department: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map(sanitizeUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { department: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return sanitizeUser(user);
}

async function createUser({ email, password, firstName, lastName, role, departmentId }) {
  email = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, role, departmentId },
    include: { department: true },
  });

  // Create leave balances
  await createDefaultLeaveBalances(user.id);

  return sanitizeUser(user);
}

async function updateUser(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { department: true },
  });
  return sanitizeUser(user);
}

async function updateUserRole(userId, role) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    include: { department: true },
  });
  return sanitizeUser(user);
}

async function deactivateUser(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    include: { department: true },
  });
  return sanitizeUser(user);
}

async function deleteUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  // Check for pending leaves
  const pendingLeaves = await prisma.leave.count({
    where: { requesterId: userId, status: { in: ['pending', 'pending_hr'] } },
  });
  if (pendingLeaves > 0) {
    throw new ApiError(400, `Cannot delete user with ${pendingLeaves} pending leave request(s). Cancel or resolve them first.`);
  }

  // Soft-delete: deactivate the user and cascade-delete their leave balances
  await prisma.$transaction(async (tx) => {
    await tx.leaveBalance.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  });
}

module.exports = { getUsers, getUserById, createUser, updateUser, updateUserRole, deactivateUser, deleteUser };
