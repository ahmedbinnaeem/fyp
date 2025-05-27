const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const Setting = require('../models/Setting');

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
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        duration++;
      }
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      user: req.user._id,
      year: currentYear
    });

    if (!balance) {
      const settings = await Setting.findOne();
      balance = await LeaveBalance.create({
        user: req.user._id,
        year: currentYear,
        annualLeaveBalance: settings.leaveSettings.annualLeaveQuota,
        sickLeaveBalance: settings.leaveSettings.sickLeaveQuota,
        carryForward: 0
      });
    }

    // Get approved and pending leaves for the year
    const leaves = await Leave.find({
      user: req.user._id,
      status: { $in: ['Approved', 'Pending'] },
      startDate: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31)
      }
    });

    // Calculate used and pending leaves
    const leaveStats = {
      annual: { used: 0, pending: 0 },
      sick: { used: 0, pending: 0 },
      personal: { used: 0, pending: 0 },
      maternity: { used: 0, pending: 0 },
      paternity: { used: 0, pending: 0 },
      unpaid: { used: 0, pending: 0 }
    };

    leaves.forEach(leave => {
      const type = leave.leaveType.toLowerCase().replace(' leave', '');
      if (leave.status === 'Approved') {
        leaveStats[type].used += leave.duration;
      } else if (leave.status === 'Pending') {
        leaveStats[type].pending += leave.duration;
      }
    });

    // Check if enough balance is available (including pending leaves)
    const type = leaveType.toLowerCase().replace(' leave', '');
    let quota = 0;
    let used = 0;
    let pending = 0;

    switch (type) {
      case 'annual':
        quota = balance.annualLeaveBalance + balance.carryForward;
        used = leaveStats.annual.used;
        pending = leaveStats.annual.pending;
        break;
      case 'sick':
        quota = balance.sickLeaveBalance;
        used = leaveStats.sick.used;
        pending = leaveStats.sick.pending;
        break;
      case 'personal':
        quota = 5; // You might want to make this configurable in settings
        used = leaveStats.personal.used;
        pending = leaveStats.personal.pending;
        break;
      case 'maternity':
        quota = 90; // You might want to make this configurable in settings
        used = leaveStats.maternity.used;
        pending = leaveStats.maternity.pending;
        break;
      case 'paternity':
        quota = 14; // You might want to make this configurable in settings
        used = leaveStats.paternity.used;
        pending = leaveStats.paternity.pending;
        break;
      case 'unpaid':
        quota = 30; // You might want to make this configurable in settings
        used = leaveStats.unpaid.used;
        pending = leaveStats.unpaid.pending;
        break;
      default:
        return res.status(400).json({ message: 'Invalid leave type' });
    }

    const remaining = quota - used - pending;
    if (duration > remaining) {
      return res.status(400).json({
        message: `Insufficient ${type} leave balance. Available: ${remaining} days (${pending} days pending), Requested: ${duration} days`
      });
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

    await leave.deleteOne();
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