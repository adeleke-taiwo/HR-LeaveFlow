const express = require('express');
const authRoutes = require('./auth.routes');
const leaveRoutes = require('./leave.routes');
const userRoutes = require('./user.routes');
const departmentRoutes = require('./department.routes');
const leaveBalanceRoutes = require('./leaveBalance.routes');
const leaveTypeRoutes = require('./leaveType.routes');
const workflowRoutes = require('./workflow.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/leaves', leaveRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/leave-balances', leaveBalanceRoutes);
router.use('/leave-types', leaveTypeRoutes);
router.use('/workflows', workflowRoutes);

module.exports = router;
