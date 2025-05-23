const express = require('express');
const router = express.Router();
const {
  requestLeave,
  getLeaves,
  getLeaveById,
  updateLeaveStatus,
  cancelLeave,
  getLeaveStats,
} = require('../controllers/leaveController');
const { protect, admin, teamLead } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, requestLeave)
  .get(protect, getLeaves);

router.route('/stats')
  .get(protect, getLeaveStats);

router.route('/:id')
  .get(protect, getLeaveById)
  .put(protect, teamLead, updateLeaveStatus)
  .delete(protect, cancelLeave);

module.exports = router; 