const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  initializeLeaveBalances,
  getMyLeaveBalance,
  getAllLeaveBalances
} = require('../controllers/leaveBalanceController');

router.post('/initialize/:year', protect, admin, initializeLeaveBalances);
router.get('/my-balance', protect, getMyLeaveBalance);
router.get('/', protect, admin, getAllLeaveBalances);

module.exports = router; 