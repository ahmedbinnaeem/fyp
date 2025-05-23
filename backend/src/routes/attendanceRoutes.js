const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendanceRecords,
  updateAttendance,
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAttendanceRecords);

router.route('/check-in')
  .post(protect, checkIn);

router.route('/check-out')
  .post(protect, checkOut);

router.route('/:id')
  .put(protect, admin, updateAttendance);

module.exports = router; 