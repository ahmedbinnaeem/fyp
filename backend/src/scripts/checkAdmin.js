const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms')
  .then(async () => {
    try {
      // Find admin user
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        console.log('Admin user found:', {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          department: admin.department,
          password: admin.password.substring(0, 10) + '...' // Show part of hashed password
        });
      } else {
        console.log('No admin user found in the database');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }); 