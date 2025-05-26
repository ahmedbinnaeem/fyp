const express = require('express');
const router = express.Router();
const {
  createLeave,
  getLeaves,
  getMyLeaves,
  getLeaveById,
  updateLeave,
  deleteLeave,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const { protect, admin } = require('../middleware/authMiddleware');

// Place specific routes before parameter routes
router.get('/my-leaves', protect, getMyLeaves);

router.route('/')
  .post(protect, createLeave)
  .get(protect, admin, getLeaves);

router.route('/:id')
  .get(protect, getLeaveById)
  .put(protect, updateLeave)
  .delete(protect, deleteLeave);

router.route('/:id/status')
  .put(protect, admin, updateLeaveStatus);

module.exports = router; 