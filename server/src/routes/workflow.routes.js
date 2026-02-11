const express = require('express');
const { z } = require('zod');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const createWorkflowSchema = z.object({
  body: z.object({
    leaveTypeId: z.string().uuid('Invalid leave type ID'),
    requiresHR: z.boolean().optional(),
    minDaysForHR: z.number().int().min(1).optional().nullable(),
  }),
});

const updateWorkflowSchema = z.object({
  body: z.object({
    requiresHR: z.boolean().optional(),
    minDaysForHR: z.number().int().min(1).optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid workflow ID'),
  }),
});

// All workflow routes require authentication + admin access
router.use(authenticate);
router.get('/', authorize('admin'), workflowController.getAllWorkflows);
router.get('/leave-type/:leaveTypeId', authorize('admin'), workflowController.getWorkflowByLeaveType);
router.post('/', authorize('admin'), validate(createWorkflowSchema), workflowController.createWorkflow);
router.patch('/:id', authorize('admin'), validate(updateWorkflowSchema), workflowController.updateWorkflow);
router.delete('/:id', authorize('admin'), workflowController.deleteWorkflow);

module.exports = router;
