const express = require('express');
const { z } = require('zod');
const leaveController = require('../controllers/leave.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const router = express.Router();

const createLeaveSchema = z.object({
  body: z.object({
    leaveTypeId: z.string().uuid('Invalid leave type'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    reason: z.string().min(1, 'Reason is required').max(500),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    reviewComment: z.string().max(500).optional(),
  }),
});

const leaveIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid leave ID'),
  }),
});

// All leave routes require authentication
router.use(authenticate);

// Reports and export endpoints
router.get('/export', authorize('manager', 'admin'), leaveController.exportLeaves);
router.get('/reports/annual/:userId/:year', authorize('manager', 'admin'), leaveController.getAnnualReport);
router.get('/reports/department/:deptId', authorize('admin'), leaveController.getDepartmentAnalytics);
router.get('/upcoming', authorize('manager', 'admin'), leaveController.getUpcomingLeaves);
router.get('/stats', leaveController.getLeaveStats);

// Regular leave endpoints
router.post('/', validate(createLeaveSchema), leaveController.createLeave);
router.get('/my', leaveController.getMyLeaves);
router.get('/calendar', leaveController.getCalendarLeaves);
router.get('/team', authorize('manager', 'admin'), leaveController.getTeamLeaves);
router.get('/', authorize('admin'), leaveController.getAllLeaves);
router.get('/:id', validate(leaveIdParamSchema), leaveController.getLeaveById);
router.patch('/:id/status', authorize('manager', 'admin'), validate(updateStatusSchema), leaveController.updateLeaveStatus);
router.patch('/:id/cancel', validate(leaveIdParamSchema), leaveController.cancelLeave);
router.delete('/:id', authorize('admin'), validate(leaveIdParamSchema), leaveController.deleteLeave);

module.exports = router;
