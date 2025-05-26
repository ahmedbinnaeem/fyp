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
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

// Clock in/out routes
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);

// Place specific routes before parameter routes
router.get('/my-attendance', protect, getMyAttendance);

router.route('/')
  .post(protect, admin, createAttendance)
  .get(protect, admin, getAttendances);

router.route('/:id')
  .get(protect, getAttendanceById)
  .put(protect, updateAttendance)
  .delete(protect, admin, deleteAttendance);

module.exports = router; 