const User = require('../models/User');
const Project = require('../models/Project');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return await getAdminDashboardStats(req, res);
    } else {
      return await getEmployeeDashboardStats(req, res);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin dashboard statistics
// @access  Private/Admin
const getAdminDashboardStats = async (req, res) => {
  try {
    // Get total employees count
    const totalEmployees = await User.countDocuments({ role: { $ne: 'admin' } });

    // Get active projects count
    const activeProjects = await Project.countDocuments({ status: 'In Progress' });

    // Get pending leaves count
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    // Get today's attendance count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Get current month's payroll total
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlyPayroll = await Payroll.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $addFields: {
          totalAllowances: {
            $reduce: {
              input: '$allowances',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.amount'] }
            }
          },
          totalDeductions: {
            $reduce: {
              input: '$deductions',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.amount'] }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $add: [
                '$basicSalary',
                '$totalAllowances',
                { $multiply: ['$overtimeHours', { $divide: ['$basicSalary', 160] }, '$overtimeRate'] }
              ]
            }
          },
          totalDeductions: { $sum: { $add: ['$totalDeductions', '$taxAmount'] } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalPayroll: { $subtract: ['$total', '$totalDeductions'] },
          totalDeductions: 1,
          employeeCount: '$count'
        }
      }
    ]);

    // Get recent projects
    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('team', 'firstName lastName')
      .populate('teamLead', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    // Get recent activities
    const recentActivities = await Promise.all([
      Leave.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName'),
      Attendance.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName'),
    ]);

    const [recentLeaves, recentAttendance] = recentActivities;

    res.json({
      stats: {
        totalEmployees,
        activeProjects,
        pendingLeaves,
        todayAttendance,
        monthlyPayroll: monthlyPayroll[0] || {
          totalPayroll: 0,
          totalDeductions: 0,
          employeeCount: 0
        }
      },
      recentProjects,
      recentActivities: {
        leaves: recentLeaves,
        attendance: recentAttendance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee dashboard statistics
// @access  Private/Employee
const getEmployeeDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get employee's active projects
    const myProjects = await Project.find({
      $or: [
        { team: req.user._id },
        { teamLead: req.user._id }
      ],
      status: { $in: ['Not Started', 'In Progress'] }
    })
    .sort({ startDate: 1 })
    .populate('teamLead', 'firstName lastName')
    .limit(5);

    // Get employee's pending leaves
    const pendingLeaves = await Leave.countDocuments({
      user: req.user._id,
      status: 'Pending'
    });

    // Get employee's leave balance
    const totalLeavesTaken = await Leave.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'Approved',
          startDate: {
            $gte: new Date(today.getFullYear(), 0, 1), // Start of current year
            $lte: new Date(today.getFullYear(), 11, 31) // End of current year
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$duration' }
        }
      }
    ]);

    // Get employee's attendance this month
    const monthlyAttendance = await Attendance.find({
      user: req.user._id,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).sort({ date: -1 });

    // Get employee's latest payslip
    const latestPayslip = await Payroll.findOne({
      user: req.user._id
    })
    .sort({ createdAt: -1 })
    .select('basicSalary allowances deductions netSalary month year');

    // Get recent activities
    const recentActivities = await Promise.all([
      Leave.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5),
      Attendance.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const [myLeaves, myAttendance] = recentActivities;

    res.json({
      stats: {
        activeProjects: myProjects.length,
        pendingLeaves,
        leaveBalance: {
          total: 20, // Assuming 20 days annual leave
          taken: totalLeavesTaken[0]?.total || 0,
          remaining: 20 - (totalLeavesTaken[0]?.total || 0)
        },
        attendance: {
          total: monthlyAttendance.length,
          present: monthlyAttendance.filter(a => a.status === 'Present').length,
          late: monthlyAttendance.filter(a => a.status === 'Late').length,
          absent: monthlyAttendance.filter(a => a.status === 'Absent').length
        }
      },
      currentProjects: myProjects,
      latestPayslip,
      recentActivities: {
        leaves: myLeaves,
        attendance: myAttendance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
}; 