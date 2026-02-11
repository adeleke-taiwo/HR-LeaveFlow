const express = require('express');
const { z } = require('zod');
const leaveTypeController = require('../controllers/leaveType.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const router = express.Router();

const createLeaveTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    defaultDaysPerYear: z.number().int().min(0).max(365),
    requiresApproval: z.boolean().optional(),
  }),
});

const updateLeaveTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    defaultDaysPerYear: z.number().int().min(0).max(365).optional(),
    requiresApproval: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid leave type ID'),
  }),
});

// All routes require authentication
router.use(authenticate);

// Get all leave types (all authenticated users)
router.get('/', leaveTypeController.getAll);

// Get specific leave type
router.get('/:id', leaveTypeController.getById);

// Admin-only routes
router.post('/', authorize('admin'), validate(createLeaveTypeSchema), leaveTypeController.create);
router.patch('/:id', authorize('admin'), validate(updateLeaveTypeSchema), leaveTypeController.update);
router.delete('/:id', authorize('admin'), leaveTypeController.delete);

module.exports = router;
