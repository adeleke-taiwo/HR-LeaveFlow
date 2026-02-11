const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');

const getUsers = catchAsync(async (req, res) => {
  const { page, limit, departmentId, role, search } = req.query;
  const result = await userService.getUsers({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    departmentId,
    role,
    search,
  });
  res.json({ success: true, ...result });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.validated.body);
  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully',
  });
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.validated.body);
  res.json({
    success: true,
    data: user,
    message: 'User updated successfully',
  });
});

const updateUserRole = catchAsync(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.validated.body.role);
  res.json({
    success: true,
    data: user,
    message: 'User role updated successfully',
  });
});

const deactivateUser = catchAsync(async (req, res) => {
  await userService.deactivateUser(req.params.id);
  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = { getUsers, getUserById, createUser, updateUser, updateUserRole, deactivateUser, deleteUser };
