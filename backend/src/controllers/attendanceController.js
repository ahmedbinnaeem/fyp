const Attendance = require('../models/Attendance');

// @desc    Check in
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res) => {
  try {
    const existingAttendance = await Attendance.findOne({
      user: req.user._id,
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999),
      },
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date: new Date(),
      checkIn: {
        time: new Date(),
        location: req.body.location,
      },
      status: 'present',
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Check out
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999),
      },
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: req.body.location,
    };

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn.time).getTime();
    const checkOutTime = new Date(attendance.checkOut.time).getTime();
    attendance.workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    const updatedAttendance = await attendance.save();
    res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendanceRecords = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (userId && req.user.role === 'admin') {
      query.user = userId;
    } else {
      query.user = req.user._id;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Admin
const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (attendance) {
      Object.assign(attendance, req.body);
      const updatedAttendance = await attendance.save();
      res.json(updatedAttendance);
    } else {
      res.status(404).json({ message: 'Attendance record not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendanceRecords,
  updateAttendance,
}; 