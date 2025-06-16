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
} = require('../controllers/payrollController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.route('/')
  .get(protect, admin, getAllPayrolls)
  .post(protect, admin, createPayroll);

router.route('/generate')
  .post(protect, admin, generatePayroll);

router.get('/stats', protect, admin, getPayrollStats);

// Employee routes - specific routes before parameter routes
router.get('/my-payroll', protect, getMyPayroll);

// Parameter routes should come last
router.route('/:id')
  .get(protect, getPayrollById)
  .put(protect, admin, updatePayrollStatus)
  .delete(protect, admin, deletePayroll);

module.exports = router; 