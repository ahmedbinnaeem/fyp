const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Generate payroll for a user
// @route   POST /api/payroll/generate
// @access  Private/Admin
const generatePayroll = async (req, res) => {
  try {
    const { userId, month, year, basicSalary } = req.body;

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({
      user: userId,
      month,
      year,
    });

    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already generated for this month' });
    }

    // Get attendance records for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Calculate working days and leaves
    const workingDays = attendance.filter(a => a.status === 'present').length;
    const totalDays = endDate.getDate();

    // Calculate deductions based on attendance
    const perDaySalary = basicSalary / totalDays;
    const deductions = (totalDays - workingDays) * perDaySalary;

    // Calculate allowances (example: 10% of basic salary)
    const allowances = basicSalary * 0.1;

    // Calculate gross and net salary
    const grossSalary = basicSalary + allowances;
    const netSalary = grossSalary - deductions;

    const payroll = await Payroll.create({
      user: userId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      workingDays,
      totalDays,
      generatedBy: req.user._id,
    });

    res.status(201).json(payroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all payrolls (admin) or user's payrolls
// @route   GET /api/payroll
// @access  Private
const getPayrolls = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    // Filter by month and year if provided
    if (req.query.month && req.query.year) {
      query.month = req.query.month;
      query.year = req.query.year;
    }

    const payrolls = await Payroll.find(query)
      .populate('user', 'firstName lastName email department')
      .populate('generatedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 });

    res.json(payrolls);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get payroll by ID
// @route   GET /api/payroll/:id
// @access  Private
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('user', 'firstName lastName email department')
      .populate('generatedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Check if user has permission to view this payroll
    if (
      req.user.role !== 'admin' &&
      payroll.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update payroll
// @route   PUT /api/payroll/:id
// @access  Private/Admin
const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Update basic calculations
    if (req.body.basicSalary) {
      const perDaySalary = req.body.basicSalary / payroll.totalDays;
      const deductions = (payroll.totalDays - payroll.workingDays) * perDaySalary;
      const allowances = req.body.basicSalary * 0.1;
      const grossSalary = req.body.basicSalary + allowances;
      const netSalary = grossSalary - deductions;

      Object.assign(payroll, {
        ...req.body,
        allowances,
        deductions,
        grossSalary,
        netSalary,
      });
    } else {
      Object.assign(payroll, req.body);
    }

    const updatedPayroll = await payroll.save();
    res.json(updatedPayroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete payroll
// @route   DELETE /api/payroll/:id
// @access  Private/Admin
const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    await payroll.remove();
    res.json({ message: 'Payroll removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get payroll statistics
// @route   GET /api/payroll/stats
// @access  Private/Admin
const getPayrollStats = async (req, res) => {
  try {
    const stats = await Payroll.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalPayout: { $sum: '$netSalary' },
          count: { $sum: 1 },
          avgSalary: { $avg: '$netSalary' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }, // Last 12 months
    ]);

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  generatePayroll,
  getPayrolls,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  getPayrollStats,
}; 