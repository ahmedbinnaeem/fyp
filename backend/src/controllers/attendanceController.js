const Attendance = require('../models/Attendance');

// Utility function to get today's attendance status
const getTodayAttendanceStatus = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendance = await Attendance.findOne({
    user: userId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  return {
    isClockedIn: !!todayAttendance?.checkIn?.time,
    isClockedOut: !!todayAttendance?.checkOut?.time,
    attendance: todayAttendance
  };
};

// @desc    Clock In
// @route   POST /api/attendance/clock-in
// @access  Private
const clockIn = async (req, res) => {
  try {
    const { isClockedIn } = await getTodayAttendanceStatus(req.user._id);

    if (isClockedIn) {
      return res.status(400).json({ message: 'Already clocked in for today' });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date: new Date(),
      checkIn: {
        time: new Date(),
        location: 'Office'
      },
      status: 'present',
      workingHours: {
        hours: 0,
        minutes: 0,
        total: 0
      }
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('user', 'firstName lastName email department');

    // Return the same structure as status endpoint
    const updatedStatus = await getTodayAttendanceStatus(req.user._id);
    res.status(201).json(updatedStatus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Clock Out
// @route   POST /api/attendance/clock-out
// @access  Private
const clockOut = async (req, res) => {
  try {
    const { attendance, isClockedIn, isClockedOut } = await getTodayAttendanceStatus(req.user._id);

    if (!isClockedIn) {
      return res.status(404).json({ message: 'No clock-in record found for today' });
    }

    if (isClockedOut) {
      return res.status(400).json({ message: 'Already clocked out for today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: 'Office'
    };

    await attendance.save();
    
    // Return the same structure as status endpoint
    const updatedStatus = await getTodayAttendanceStatus(req.user._id);
    res.json(updatedStatus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private/Admin
const getAttendances = async (req, res) => {
  try {
    const { date } = req.query;
    
    // Create date range for the selected date (start of day to end of day)
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const attendances = await Attendance.find(query)
      .populate('user', 'firstName lastName email department')
      .sort({ date: -1 });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's attendance records
// @route   GET /api/attendance/my-attendance
// @access  Private
const getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { user: req.user._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendances = await Attendance.find(query)
      .populate('user', 'firstName lastName email department')
      .sort({ date: -1 });

    // Get today's attendance status using the shared utility function
    const todayStatus = await getTodayAttendanceStatus(req.user._id);

    res.json({
      attendances,
      todayStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Private
const createAttendance = async (req, res) => {
  try {
    const { date, checkIn, checkOut, status, notes } = req.body;

    // Check if attendance record already exists for this date
    const existingAttendance = await Attendance.findOne({
      user: req.user._id,
      date: new Date(date).toISOString().split('T')[0],
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance record already exists for this date' });
    }

    const attendance = await Attendance.create({
      user: req.user._id,
      date,
      checkIn,
      checkOut,
      status: status || 'present',
      notes,
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('user', 'firstName lastName email department');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get attendance record by ID
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('user', 'firstName lastName email department');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check if user has permission to view this attendance
    if (
      req.user.role !== 'admin' &&
      attendance.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private
const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Only allow updating own attendance or admin
    if (
      req.user.role !== 'admin' &&
      attendance.user.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { date, checkIn, checkOut, status, notes } = req.body;

    attendance.date = date || attendance.date;
    attendance.checkIn = checkIn || attendance.checkIn;
    attendance.checkOut = checkOut || attendance.checkOut;
    attendance.status = status || attendance.status;
    attendance.notes = notes || attendance.notes;

      const updatedAttendance = await attendance.save();
      res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Only admin can delete attendance records
    if (req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await attendance.remove();
    res.json({ message: 'Attendance record removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get clock-in status
// @route   GET /api/attendance/status
// @access  Private
const getClockInStatus = async (req, res) => {
  try {
    const status = await getTodayAttendanceStatus(req.user._id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAttendances,
  getMyAttendance,
  createAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  clockIn,
  clockOut,
  getClockInStatus,
}; 