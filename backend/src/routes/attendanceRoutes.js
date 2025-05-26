const express = require('express');
const router = express.Router();
const {
  createAttendance,
  getAttendances,
  getMyAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  clockIn,
  clockOut,
  getClockInStatus,
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

// Clock in/out routes
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.get('/status', protect, getClockInStatus);

// Regular attendance routes
router.route('/')
  .get(protect, admin, getAttendances)
  .post(protect, createAttendance);

router.get('/my-attendance', protect, getMyAttendance);

router.route('/:id')
  .get(protect, getAttendanceById)
  .put(protect, updateAttendance)
  .delete(protect, admin, deleteAttendance);

module.exports = router; 