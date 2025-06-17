const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function migrateEmployeeIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find().sort({ createdAt: 1 });
    console.log(`Found ${users.length} users`);

    // Update admin user
    const admin = users.find(user => user.role === 'admin');
    if (admin) {
      await User.updateOne(
        { _id: admin._id },
        { $set: { employeeId: 'EMP001' } }
      );
      console.log('Updated admin employee ID: EMP001');
    }

    // Update employee users
    let employeeCount = 1;
    for (const user of users) {
      if (user.role !== 'admin') {
        const year = new Date(user.createdAt).getFullYear().toString().slice(-2);
        const employeeId = `EMP${year}${(employeeCount + 1).toString().padStart(4, '0')}`;
        
        await User.updateOne(
          { _id: user._id },
          { $set: { employeeId } }
        );
        
        console.log(`Updated employee ID for ${user.firstName} ${user.lastName}:`, employeeId);
        employeeCount++;
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateEmployeeIds(); 