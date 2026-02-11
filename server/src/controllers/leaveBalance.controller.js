const leaveBalanceService = require('../services/leaveBalance.service');
const catchAsync = require('../utils/catchAsync');

const getMyBalances = catchAsync(async (req, res) => {
  const balances = await leaveBalanceService.getMyBalances(req.user.id);
  res.json({ success: true, data: balances });
});

const getUserBalances = catchAsync(async (req, res) => {
  const balances = await leaveBalanceService.getUserBalances(req.params.userId);
  res.json({ success: true, data: balances });
});

const allocateBalances = catchAsync(async (req, res) => {
  const balances = await leaveBalanceService.allocateBalances(req.validated.body);
  res.json({
    success: true,
    data: balances,
    message: 'Balances allocated successfully',
  });
});

const adjustBalance = catchAsync(async (req, res) => {
  const balance = await leaveBalanceService.adjustBalance(req.params.id, req.validated.body);
  res.json({
    success: true,
    data: balance,
    message: 'Balance adjusted successfully',
  });
});

module.exports = { getMyBalances, getUserBalances, allocateBalances, adjustBalance };
