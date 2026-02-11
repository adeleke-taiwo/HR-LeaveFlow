const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.validated.body);
  res.status(201).json({
    success: true,
    data: user,
    message: 'Registration successful',
  });
});

const login = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.validated.body);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({
    success: true,
    data: { accessToken, user },
    message: 'Login successful',
  });
});

const refresh = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  const { accessToken, user } = await authService.refreshToken(token);

  res.json({
    success: true,
    data: { accessToken, user },
  });
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken', { path: '/' });
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({
    success: true,
    data: user,
  });
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.validated.body);
  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = { register, login, refresh, logout, getMe, changePassword };
