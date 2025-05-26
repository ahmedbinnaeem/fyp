const Leave = require('../models/Leave');

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private/Admin
const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('user', 'firstName lastName email department')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's leaves
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id })
      .populate('user', 'firstName lastName email department')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new leave request
// @route   POST /api/leaves
// @access  Private
const createLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Calculate duration (excluding weekends)
    const start = new Date(startDate);
    const end = new Date(endDate);
    let duration = 0;
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        duration++;
      }
    }

    const leave = await Leave.create({
      user: req.user._id,
      leaveType,
      startDate,
      endDate,
      duration,
      reason,
      status: 'Pending'
    });

    const populatedLeave = await Leave.findById(leave._id)
      .populate('user', 'firstName lastName email department');

    res.status(201).json(populatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get leave by ID
// @route   GET /api/leaves/:id
// @access  Private
const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('user', 'firstName lastName email department');

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Check if user has permission to view this leave
    if (
      req.user.role !== 'admin' &&
      leave.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update leave
// @route   PUT /api/leaves/:id
// @access  Private
const updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Only allow updating own leaves that are pending
    if (
      leave.user.toString() !== req.user._id.toString() ||
      leave.status !== 'Pending'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    // Calculate duration (excluding weekends)
    const start = new Date(startDate);
    const end = new Date(endDate);
    let duration = 0;
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        duration++;
      }
    }

    leave.leaveType = leaveType;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.duration = duration;
    leave.reason = reason;

    const updatedLeave = await leave.save();
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete leave
// @route   DELETE /api/leaves/:id
// @access  Private
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Only allow deleting own leaves that are pending
    if (
      leave.user.toString() !== req.user._id.toString() ||
      leave.status !== 'Pending'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await leave.remove();
    res.json({ message: 'Leave removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update leave status (approve/reject)
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Leave is not pending' });
    }

    leave.status = status;
    leave.actionBy = req.user._id;
    leave.actionAt = Date.now();

    const updatedLeave = await leave.save();
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getLeaves,
  getMyLeaves,
  createLeave,
  getLeaveById,
  updateLeave,
  deleteLeave,
  updateLeaveStatus,
}; 