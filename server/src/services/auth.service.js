const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { createDefaultLeaveBalances } = require('../utils/leaveBalanceHelper');

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, departmentId: user.departmentId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function register({ email, password, firstName, lastName, departmentId }) {
  email = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw new ApiError(404, 'Department not found');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, departmentId },
    include: { department: true },
  });

  // Create leave balances for the current year
  await createDefaultLeaveBalances(user.id);

  return sanitizeUser(user);
}

async function login({ email, password }) {
  email = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    include: { department: true },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

async function refreshToken(token) {
  if (!token) {
    throw new ApiError(401, 'Refresh token required');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const accessToken = generateAccessToken(user);
    return { accessToken, user: sanitizeUser(user) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid refresh token');
  }
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { department: true },
  });

  if (!user) throw new ApiError(404, 'User not found');
  return sanitizeUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

module.exports = { register, login, refreshToken, getMe, changePassword };
