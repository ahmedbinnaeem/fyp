const express = require('express');
const router = express.Router();
const {
  createPayroll,
  generatePayroll,
  getPayrolls,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  getPayrollStats,
} = require('../controllers/payrollController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createPayroll)
  .get(protect, getPayrolls);

router.route('/generate')
  .post(protect, admin, generatePayroll);

router.route('/stats')
  .get(protect, admin, getPayrollStats);

router.route('/:id')
  .get(protect, getPayrollById)
  .put(protect, admin, updatePayroll)
  .delete(protect, admin, deletePayroll);

module.exports = router; 