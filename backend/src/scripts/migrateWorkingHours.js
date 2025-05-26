const mongoose = require('mongoose');
require('dotenv').config();

const migrateWorkingHours = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const Attendance = require('../models/Attendance');

    // Find all attendance records
    const attendances = await Attendance.find({});
    console.log(`Found ${attendances.length} attendance records to migrate...`);

    // Update each record
    for (const attendance of attendances) {
      if (typeof attendance.workingHours === 'number') {
        const hours = Math.floor(attendance.workingHours);
        const minutes = Math.round((attendance.workingHours - hours) * 60);
        
        attendance.workingHours = {
          hours,
          minutes,
          total: Number(attendance.workingHours.toFixed(2))
        };
        
        await attendance.save();
        console.log(`Updated attendance record: ${attendance._id}`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateWorkingHours(); 