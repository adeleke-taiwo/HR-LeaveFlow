const prisma = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const getAll = catchAsync(async (req, res) => {
  const leaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: leaveTypes });
});

const getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const leaveType = await prisma.leaveType.findUnique({
    where: { id },
  });

  if (!leaveType) {
    throw new ApiError(404, 'Leave type not found');
  }

  res.json({ success: true, data: leaveType });
});

const create = catchAsync(async (req, res) => {
  const { name, description, defaultDaysPerYear, requiresApproval } = req.body;

  const leaveType = await prisma.leaveType.create({
    data: {
      name,
      description,
      defaultDaysPerYear,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Leave type created successfully',
    data: leaveType,
  });
});

const update = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, defaultDaysPerYear, requiresApproval, isActive } = req.body;

  const leaveType = await prisma.leaveType.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(defaultDaysPerYear && { defaultDaysPerYear }),
      ...(requiresApproval !== undefined && { requiresApproval }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({
    success: true,
    message: 'Leave type updated successfully',
    data: leaveType,
  });
});

const deleteLeaveType = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Soft delete by setting isActive to false
  await prisma.leaveType.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Leave type deleted successfully',
  });
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteLeaveType,
};
