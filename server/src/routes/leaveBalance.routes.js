const express = require('express');
const { z } = require('zod');
const leaveBalanceController = require('../controllers/leaveBalance.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const router = express.Router();

const allocateSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    year: z.number().int().min(2020).max(2100),
    allocations: z.array(z.object({
      leaveTypeId: z.string().uuid(),
      allocated: z.number().int().min(0),
    })).min(1),
  }),
});

const adjustSchema = z.object({
  body: z.object({
    allocated: z.number().int().min(0).optional(),
    used: z.number().int().min(0).optional(),
    pending: z.number().int().min(0).optional(),
  }),
});

router.use(authenticate);

router.get('/my', leaveBalanceController.getMyBalances);
router.get('/user/:userId', authorize('manager', 'admin'), leaveBalanceController.getUserBalances);
router.post('/allocate', authorize('admin'), validate(allocateSchema), leaveBalanceController.allocateBalances);
router.patch('/:id', authorize('admin'), validate(adjustSchema), leaveBalanceController.adjustBalance);

module.exports = router;
