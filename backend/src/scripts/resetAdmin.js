const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

async function resetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    
    // Delete existing admin
    await User.deleteOne({ role: 'admin' });
    console.log('Existing admin user deleted');

    // Create password hash
    const password = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hash created');

    // Create admin user directly without mongoose middleware
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@hrms.com',
      password: hashedPassword,
      role: 'admin',
      department: 'Management',
    });

    await admin.save({ validateBeforeSave: true });
    console.log('Admin user saved to database');

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('Password verification:', isMatch ? 'PASSED' : 'FAILED');

    // Test matchPassword method
    const methodMatch = await admin.matchPassword(password);
    console.log('matchPassword method test:', methodMatch ? 'PASSED' : 'FAILED');

    console.log('Admin user details:', {
      id: admin._id,
      email: admin.email,
      passwordHash: admin.password
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetAdmin(); 