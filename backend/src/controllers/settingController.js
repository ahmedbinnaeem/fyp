const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await Setting.create({
      companyName: 'Default Company',
      companyEmail: 'company@example.com',
      companyPhone: '+1234567890',
      companyAddress: 'Default Address',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: {
        start: '09:00',
        end: '17:00',
      },
      leaveSettings: {
        annualLeaveQuota: 14,
        sickLeaveQuota: 7,
        carryForwardLimit: 5,
      },
      payrollSettings: {
        payrollCycle: 'monthly',
        payDay: 1,
        taxRate: 0,
        overtimeRate: 1.5,
      },
      emailNotifications: {
        leaveRequests: true,
        payrollGeneration: true,
        attendanceAlerts: true,
      },
    });
  }

  res.json(settings);
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.findOne();

  if (!settings) {
    res.status(404);
    throw new Error('Settings not found');
  }

  const updatedSettings = await Setting.findOneAndUpdate(
    {},
    {
      $set: {
        companyName: req.body.companyName,
        companyEmail: req.body.companyEmail,
        companyPhone: req.body.companyPhone,
        companyAddress: req.body.companyAddress,
        workingDays: req.body.workingDays,
        workingHours: req.body.workingHours,
        leaveSettings: req.body.leaveSettings,
        payrollSettings: req.body.payrollSettings,
        emailNotifications: req.body.emailNotifications,
      },
    },
    { new: true, runValidators: true }
  );

  res.json(updatedSettings);
});

module.exports = {
  getSettings,
  updateSettings,
}; 