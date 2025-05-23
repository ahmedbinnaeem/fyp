const Leave = require('../models/Leave');

// @desc    Request a leave
// @route   POST /api/leaves
// @access  Private
const requestLeave = async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    // Check for overlapping leaves
    const overlappingLeave = await Leave.findOne({
      user: req.user._id,
      status: { $ne: 'rejected' },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (overlappingLeave) {
      return res.status(400).json({ message: 'You already have a leave request for these dates' });
    }

    const leave = await Leave.create({
      user: req.user._id,
      startDate,
      endDate,
      type,
      reason,
      status: 'pending',
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all leaves (admin) or user's leaves
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    if (req.user.role === 'team_lead') {
      // Team leads can see their team members' leaves
      const teamMembers = await User.find({ 'department': req.user.department });
      const teamMemberIds = teamMembers.map(member => member._id);
      query.$or = [{ user: req.user._id }, { user: { $in: teamMemberIds } }];
    }

    const leaves = await Leave.find(query)
      .populate('user', 'firstName lastName email department')
      .sort({ createdAt: -1 });

    res.json(leaves);
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
      req.user.role !== 'team_lead' &&
      leave.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update leave status
// @route   PUT /api/leaves/:id
// @access  Private/Admin/TeamLead
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Only admin or team lead of same department can update status
    if (
      req.user.role !== 'admin' &&
      (req.user.role !== 'team_lead' || req.user.department !== leave.user.department)
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    leave.status = status;
    leave.comment = comment;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();

    const updatedLeave = await leave.save();
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel leave request
// @route   DELETE /api/leaves/:id
// @access  Private
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Only the user who created the leave request can cancel it
    if (leave.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Can only cancel pending leaves
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel approved/rejected leave' });
    }

    await leave.remove();
    res.json({ message: 'Leave request cancelled' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Private
const getLeaveStats = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    const stats = await Leave.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      ...Object.fromEntries(stats.map(({ _id, count }) => [_id, count])),
    };

    res.json(formattedStats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  requestLeave,
  getLeaves,
  getLeaveById,
  updateLeaveStatus,
  cancelLeave,
  getLeaveStats,
}; 