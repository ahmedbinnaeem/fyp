const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');

// @desc    Create manual payroll
// @route   POST /api/payroll
// @access  Private/Admin
const createPayroll = async (req, res) => {
  try {
    const {
      employee,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      netSalary
    } = req.body;

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({
      user: employee,
      month,
      year,
    });

    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already exists for this month' });
    }

    // Format allowances as array of objects
    const formattedAllowances = [
      {
        type: 'Housing',
        amount: Number(allowances?.housing || 0),
        description: 'Housing allowance'
      },
      {
        type: 'Transport',
        amount: Number(allowances?.transport || 0),
        description: 'Transport allowance'
      },
      {
        type: 'Meal',
        amount: Number(allowances?.meal || 0),
        description: 'Meal allowance'
      },
      {
        type: 'Other',
        amount: Number(allowances?.other || 0),
        description: 'Other allowances'
      }
    ].filter(allowance => allowance.amount > 0); // Only include non-zero allowances

    // Format deductions as array of objects
    const formattedDeductions = [
      {
        type: 'Tax',
        amount: Number(deductions?.tax || 0),
        description: 'Income tax'
      },
      {
        type: 'Insurance',
        amount: Number(deductions?.insurance || 0),
        description: 'Health insurance'
      },
      {
        type: 'Other',
        amount: Number(deductions?.other || 0),
        description: 'Other deductions'
      }
    ].filter(deduction => deduction.amount > 0); // Only include non-zero deductions

    // Create new payroll with validated data
    const payroll = await Payroll.create({
      user: employee,
      month: Number(month),
      year: Number(year),
      basicSalary: Number(basicSalary),
      allowances: formattedAllowances,
      deductions: formattedDeductions,
      status: 'Draft'
    });

    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate('user', 'firstName lastName email department');

    res.status(201).json(populatedPayroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Generate monthly payroll for all employees
// @route   POST /api/payroll/generate
// @access  Private/Admin
const generatePayroll = asyncHandler(async (req, res) => {
  const { month, year } = req.body;

  // Validate month and year
  const currentDate = new Date();
  if (year > currentDate.getFullYear() || (year === currentDate.getFullYear() && month > currentDate.getMonth() + 1)) {
    res.status(400);
    throw new Error('Cannot generate payroll for future dates');
  }

  // Get all active employees
  const employees = await User.find({ 
    role: { $ne: 'admin' },
    joiningDate: { $exists: true, $ne: null } // Only include employees with joining date
  });

  // Get settings for tax rate and overtime rate
  const settings = await Setting.findOne();
  if (!settings) {
    res.status(400);
    throw new Error('System settings not configured');
  }

  // If no employees found, return empty array with message
  if (!employees.length) {
    return res.status(200).json({
      message: 'No eligible employees found for payroll generation',
      payrolls: []
    });
  }

  // Get attendance data for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const attendanceData = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  });

  // Group attendance by user
  const attendanceByUser = attendanceData.reduce((acc, record) => {
    if (!acc[record.user]) {
      acc[record.user] = [];
    }
    acc[record.user].push(record);
    return acc;
  }, {});

  // Generate payroll for each employee
  const payrollPromises = employees.map(async (employee) => {
    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({ 
      user: employee._id, 
      month, 
      year 
    });
    if (existingPayroll) {
      return null; // Skip if payroll exists
    }

    // Check if employee joined in this month or later
    const joiningDate = new Date(employee.joiningDate);
    const payrollMonth = new Date(year, month - 1, 1); // First day of payroll month
    const nextMonth = new Date(year, month, 1); // First day of next month

    // Skip if employee joined after the payroll month
    if (joiningDate >= nextMonth) {
      return null;
    }

    // Calculate pro-rated basic salary
    let proRatedBasicSalary = employee.basicSalary;
    if (joiningDate > payrollMonth) {
      // Calculate days worked in the month
      const daysInMonth = endDate.getDate();
      const daysWorked = daysInMonth - joiningDate.getDate() + 1;
      // Pro-rate the salary
      proRatedBasicSalary = (employee.basicSalary / daysInMonth) * daysWorked;
    }

    // Calculate overtime hours
    const employeeAttendance = attendanceByUser[employee._id] || [];
    const overtimeHours = employeeAttendance.reduce((total, record) => {
      if (record.status === 'Present' && record.overtimeHours) {
        return total + record.overtimeHours;
      }
      return total;
    }, 0);

    // Calculate tax amount based on pro-rated basic salary
    const taxAmount = (proRatedBasicSalary * settings.payrollSettings.taxRate) / 100;

    // Create default allowances and deductions
    const allowances = [
      {
        type: 'Housing',
        amount: 0,
        description: 'Housing allowance'
      },
      {
        type: 'Transport',
        amount: 0,
        description: 'Transport allowance'
      }
    ];

    const deductions = [
      {
        type: 'Tax',
        amount: taxAmount,
        description: 'Income tax'
      },
      {
        type: 'Insurance',
        amount: 0,
        description: 'Health insurance'
      }
    ];

    // Create payroll record
    return Payroll.create({
      user: employee._id,
      month,
      year,
      basicSalary: proRatedBasicSalary,
      overtimeHours,
      overtimeRate: settings.payrollSettings.overtimeRate,
      allowances,
      deductions,
      taxAmount,
      status: 'Draft',
      remarks: joiningDate > payrollMonth ? 
        `Pro-rated salary for joining on ${joiningDate.toLocaleDateString()}` : 
        undefined
    });
  });

  // Wait for all payrolls to be created
  const results = await Promise.all(payrollPromises);
  const createdPayrolls = results.filter(payroll => payroll !== null);

  // Populate user details for the response
  const populatedPayrolls = await Payroll.find({
    _id: { $in: createdPayrolls.map(p => p._id) }
  }).populate('user', 'firstName lastName email department');

  // Return response with appropriate message
  if (createdPayrolls.length === 0) {
    return res.status(200).json({
      message: 'No new payrolls were generated. They may already exist for this period or employees joined after this month.',
      payrolls: []
    });
  }

  res.status(201).json({
    message: `Successfully generated ${createdPayrolls.length} payroll(s)`,
    payrolls: populatedPayrolls
  });
});

// @desc    Get all payrolls (admin)
// @route   GET /api/payroll
// @access  Private/Admin
const getAllPayrolls = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  let query = {};
  if (month && year) {
    query = { month: Number(month), year: Number(year) };
  }

  const payrolls = await Payroll.find(query)
    .populate('user', 'firstName lastName email employeeId department')
    .sort({ createdAt: -1 });

  res.json(payrolls);
});

// @desc    Get employee's payroll history
// @route   GET /api/payroll/my-payroll
// @access  Private
const getMyPayroll = asyncHandler(async (req, res) => {
  const payrolls = await Payroll.find({ user: req.user._id })
    .sort({ year: -1, month: -1 });

  res.json(payrolls);
});

// @desc    Get single payroll detail
// @route   GET /api/payroll/:id
// @access  Private
const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id)
    .populate('user', 'firstName lastName email employeeId department');

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  // Check if user is admin or the payroll belongs to the requesting user
  if (!req.user.isAdmin && payroll.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this payroll');
  }

  res.json(payroll);
});

// @desc    Update payroll status
// @route   PUT /api/payroll/:id
// @access  Private/Admin
const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { status, paymentDate, paymentMethod, remarks } = req.body;

  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  payroll.status = status;
  if (status === 'Paid') {
    payroll.paymentDate = paymentDate || new Date();
    payroll.paymentMethod = paymentMethod;
  }
  if (remarks) {
    payroll.remarks = remarks;
  }

  const updatedPayroll = await payroll.save();

  res.json(updatedPayroll);
});

// @desc    Delete payroll
// @route   DELETE /api/payroll/:id
// @access  Private/Admin
const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    res.status(404);
    throw new Error('Payroll not found');
  }

  if (payroll.status !== 'Draft') {
    res.status(400);
    throw new Error('Can only delete draft payrolls');
  }

  await payroll.remove();

  res.json({ message: 'Payroll removed' });
});

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
  createPayroll,
  generatePayroll,
  getAllPayrolls,
  getMyPayroll,
  getPayrollById,
  updatePayrollStatus,
  deletePayroll,
  getPayrollStats,
}; 