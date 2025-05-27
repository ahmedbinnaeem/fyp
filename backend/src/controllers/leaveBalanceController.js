const LeaveBalance = require('../models/LeaveBalance');
const Setting = require('../models/Setting');
const Leave = require('../models/Leave');

// @desc    Initialize or reset leave balances for a year
// @route   POST /api/leave-balances/initialize/:year
// @access  Private/Admin
const initializeLeaveBalances = async (req, res) => {
  try {
    const { year } = req.params;
    const settings = await Setting.findOne();
    
    if (!settings) {
      return res.status(400).json({ message: 'System settings not configured' });
    }

    // Get all leave balances for the year
    const existingBalances = await LeaveBalance.find({ year });
    const existingUserIds = existingBalances.map(balance => balance.user.toString());

    // Get all active users
    const User = require('../models/User');
    const users = await User.find({ isActive: true });

    const operations = users.map(user => {
      // If user already has a balance for this year, skip
      if (existingUserIds.includes(user._id.toString())) {
        return null;
      }

      // Calculate carry forward from previous year if applicable
      const carryForward = 0; // This will be implemented in a separate function

      return {
        updateOne: {
          filter: { user: user._id, year },
          update: {
            $setOnInsert: {
              annualLeaveBalance: settings.leaveSettings.annualLeaveQuota,
              sickLeaveBalance: settings.leaveSettings.sickLeaveQuota,
              carryForward
            }
          },
          upsert: true
        }
      };
    }).filter(op => op !== null);

    if (operations.length > 0) {
      await LeaveBalance.bulkWrite(operations);
    }

    res.json({ message: 'Leave balances initialized successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get leave balance for current user
// @route   GET /api/leave-balances/my-balance
// @access  Private
const getMyLeaveBalance = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      user: req.user._id,
      year: currentYear
    });

    if (!balance) {
      const settings = await Setting.findOne();
      if (!settings) {
        return res.status(400).json({ message: 'System settings not configured' });
      }
      balance = await LeaveBalance.create({
        user: req.user._id,
        year: currentYear,
        annualLeaveBalance: settings.leaveSettings.annualLeaveQuota,
        sickLeaveBalance: settings.leaveSettings.sickLeaveQuota,
        carryForward: 0
      });
    }

    // Get settings for leave quotas
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(400).json({ message: 'System settings not configured' });
    }

    // Get approved and pending leaves count
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
      const type = leave.leaveType.toLowerCase().replace(' ', '');
      if (leave.status === 'Approved') {
        leaveStats[type].used += leave.duration;
      } else if (leave.status === 'Pending') {
        leaveStats[type].pending += leave.duration;
      }
    });

    res.json({
      year: balance.year,
      annualLeave: {
        total: balance.annualLeaveBalance + balance.carryForward,
        used: leaveStats.annual.used,
        pending: leaveStats.annual.pending,
        remaining: balance.annualLeaveBalance + balance.carryForward - leaveStats.annual.used - leaveStats.annual.pending
      },
      sickLeave: {
        total: balance.sickLeaveBalance,
        used: leaveStats.sick.used,
        pending: leaveStats.sick.pending,
        remaining: balance.sickLeaveBalance - leaveStats.sick.used - leaveStats.sick.pending
      },
      personalLeave: {
        total: settings.leaveSettings.personalLeaveQuota,
        used: leaveStats.personal.used,
        pending: leaveStats.personal.pending,
        remaining: settings.leaveSettings.personalLeaveQuota - leaveStats.personal.used - leaveStats.personal.pending
      },
      maternityLeave: {
        total: settings.leaveSettings.maternityLeaveQuota,
        used: leaveStats.maternity.used,
        pending: leaveStats.maternity.pending,
        remaining: settings.leaveSettings.maternityLeaveQuota - leaveStats.maternity.used - leaveStats.maternity.pending
      },
      paternityLeave: {
        total: settings.leaveSettings.paternityLeaveQuota,
        used: leaveStats.paternity.used,
        pending: leaveStats.paternity.pending,
        remaining: settings.leaveSettings.paternityLeaveQuota - leaveStats.paternity.used - leaveStats.paternity.pending
      },
      unpaidLeave: {
        total: settings.leaveSettings.unpaidLeaveQuota,
        used: leaveStats.unpaid.used,
        pending: leaveStats.unpaid.pending,
        remaining: settings.leaveSettings.unpaidLeaveQuota - leaveStats.unpaid.used - leaveStats.unpaid.pending
      },
      carryForward: balance.carryForward
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all employees' leave balances (for admin)
// @route   GET /api/leave-balances
// @access  Private/Admin
const getAllLeaveBalances = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const balances = await LeaveBalance.find({ year: currentYear })
      .populate('user', 'firstName lastName email department');

    // Get all approved and pending leaves for the year
    const leaves = await Leave.find({
      status: { $in: ['Approved', 'Pending'] },
      startDate: {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31)
      }
    });

    // Calculate used and pending leaves for each user
    const leaveStatsMap = {};
    leaves.forEach(leave => {
      if (!leaveStatsMap[leave.user]) {
        leaveStatsMap[leave.user] = {
          annual: { used: 0, pending: 0 },
          sick: { used: 0, pending: 0 },
          personal: { used: 0, pending: 0 },
          maternity: { used: 0, pending: 0 },
          paternity: { used: 0, pending: 0 },
          unpaid: { used: 0, pending: 0 }
        };
      }
      const type = leave.leaveType.toLowerCase().replace(' ', '');
      if (leave.status === 'Approved') {
        leaveStatsMap[leave.user][type].used += leave.duration;
      } else if (leave.status === 'Pending') {
        leaveStatsMap[leave.user][type].pending += leave.duration;
      }
    });

    const formattedBalances = balances.map(balance => ({
      _id: balance._id,
      user: balance.user,
      year: balance.year,
      annualLeave: {
        total: balance.annualLeaveBalance + balance.carryForward,
        used: leaveStatsMap[balance.user._id]?.annual.used || 0,
        pending: leaveStatsMap[balance.user._id]?.annual.pending || 0,
        remaining: balance.annualLeaveBalance + balance.carryForward - 
          (leaveStatsMap[balance.user._id]?.annual.used || 0) - 
          (leaveStatsMap[balance.user._id]?.annual.pending || 0)
      },
      sickLeave: {
        total: balance.sickLeaveBalance,
        used: leaveStatsMap[balance.user._id]?.sick.used || 0,
        pending: leaveStatsMap[balance.user._id]?.sick.pending || 0,
        remaining: balance.sickLeaveBalance - 
          (leaveStatsMap[balance.user._id]?.sick.used || 0) - 
          (leaveStatsMap[balance.user._id]?.sick.pending || 0)
      },
      personalLeave: {
        total: 5,
        used: leaveStatsMap[balance.user._id]?.personal.used || 0,
        pending: leaveStatsMap[balance.user._id]?.personal.pending || 0,
        remaining: 5 - 
          (leaveStatsMap[balance.user._id]?.personal.used || 0) - 
          (leaveStatsMap[balance.user._id]?.personal.pending || 0)
      },
      maternityLeave: {
        total: 90,
        used: leaveStatsMap[balance.user._id]?.maternity.used || 0,
        pending: leaveStatsMap[balance.user._id]?.maternity.pending || 0,
        remaining: 90 - 
          (leaveStatsMap[balance.user._id]?.maternity.used || 0) - 
          (leaveStatsMap[balance.user._id]?.maternity.pending || 0)
      },
      paternityLeave: {
        total: 14,
        used: leaveStatsMap[balance.user._id]?.paternity.used || 0,
        pending: leaveStatsMap[balance.user._id]?.paternity.pending || 0,
        remaining: 14 - 
          (leaveStatsMap[balance.user._id]?.paternity.used || 0) - 
          (leaveStatsMap[balance.user._id]?.paternity.pending || 0)
      },
      unpaidLeave: {
        total: 30,
        used: leaveStatsMap[balance.user._id]?.unpaid.used || 0,
        pending: leaveStatsMap[balance.user._id]?.unpaid.pending || 0,
        remaining: 30 - 
          (leaveStatsMap[balance.user._id]?.unpaid.used || 0) - 
          (leaveStatsMap[balance.user._id]?.unpaid.pending || 0)
      },
      carryForward: balance.carryForward
    }));

    res.json(formattedBalances);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  initializeLeaveBalances,
  getMyLeaveBalance,
  getAllLeaveBalances
}; 