const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms')
  .then(async () => {
    try {
      // Check if admin already exists
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        console.log('Admin user already exists');
        process.exit(0);
      }

      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      const admin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hrms.com',
        password: hashedPassword,
        role: 'admin',
        department: 'Management',
      });

      console.log('Admin user created successfully:', {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      });
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }); 