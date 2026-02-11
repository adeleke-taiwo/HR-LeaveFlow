const workflowService = require('../services/workflowService');
const catchAsync = require('../utils/catchAsync');

const getAllWorkflows = catchAsync(async (req, res) => {
  const workflows = await workflowService.getAllWorkflows();
  res.json({ success: true, data: workflows });
});

const getWorkflowByLeaveType = catchAsync(async (req, res) => {
  const workflow = await workflowService.getWorkflowByLeaveType(req.params.leaveTypeId);
  res.json({ success: true, data: workflow });
});

const createWorkflow = catchAsync(async (req, res) => {
  const workflow = await workflowService.createWorkflow(req.body);
  res.status(201).json({
    success: true,
    data: workflow,
    message: 'Workflow created successfully',
  });
});

const updateWorkflow = catchAsync(async (req, res) => {
  const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
  res.json({
    success: true,
    data: workflow,
    message: 'Workflow updated successfully',
  });
});

const deleteWorkflow = catchAsync(async (req, res) => {
  await workflowService.deleteWorkflow(req.params.id);
  res.json({
    success: true,
    message: 'Workflow deleted successfully',
  });
});

module.exports = {
  getAllWorkflows,
  getWorkflowByLeaveType,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
};
