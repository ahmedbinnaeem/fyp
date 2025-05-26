const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  updateUser,
  changePassword,
  deleteUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, admin, registerUser).get(protect, admin, getUsers);
router.post('/login', loginUser);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.put('/change-password', protect, changePassword);

// Add route for updating specific user by ID
router.route('/:id').put(protect, admin, updateUser).delete(protect, admin, deleteUser);

module.exports = router; 