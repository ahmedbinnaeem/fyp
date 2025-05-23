const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define User model directly here to avoid any middleware complications
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  department: String
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    
    // Delete any existing admin
    await User.deleteMany({ role: 'admin' });
    
    // Create password hash
    const plainPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@hrms.com',
      password: hashedPassword,
      role: 'admin',
      department: 'Management'
    });

    // Verify the password
    const isMatch = await bcrypt.compare(plainPassword, admin.password);
    
    console.log('Admin created:', {
      id: admin._id,
      email: admin.email,
      passwordHash: admin.password,
      verificationTest: isMatch ? 'PASSED' : 'FAILED'
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin(); 