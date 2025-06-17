const express = require('express');
const router = express.Router();
const {
  createPayroll,
  generatePayroll,
  getAllPayrolls,
  getMyPayroll,
  getPayrollById,
  updatePayrollStatus,
  deletePayroll,
  getPayrollStats,
  getPayslip
} = require('../controllers/payrollController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.route('/')
  .get(protect, admin, getAllPayrolls)
  .post(protect, admin, createPayroll);

router.route('/generate')
  .post(protect, admin, generatePayroll);

router.route('/my-payroll')
  .get(protect, getMyPayroll);

router.route('/stats')
  .get(protect, admin, getPayrollStats);

// Parameter routes should come last
router.route('/:id')
  .get(protect, getPayrollById)
  .put(protect, admin, updatePayrollStatus)
  .delete(protect, admin, deletePayroll);

router.route('/:id/payslip')
  .get(protect, getPayslip);

module.exports = router; 