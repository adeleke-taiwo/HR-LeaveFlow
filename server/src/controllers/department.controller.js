const departmentService = require('../services/department.service');
const catchAsync = require('../utils/catchAsync');

const getDepartments = catchAsync(async (req, res) => {
  const departments = await departmentService.getDepartments();
  res.json({ success: true, data: departments });
});

const createDepartment = catchAsync(async (req, res) => {
  const department = await departmentService.createDepartment(req.validated.body);
  res.status(201).json({
    success: true,
    data: department,
    message: 'Department created successfully',
  });
});

const updateDepartment = catchAsync(async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.validated.body);
  res.json({
    success: true,
    data: department,
    message: 'Department updated successfully',
  });
});

const deleteDepartment = catchAsync(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  res.json({
    success: true,
    message: 'Department deleted successfully',
  });
});

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
