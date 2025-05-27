const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Setting = require('./Setting');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female'],
    validate: {
      validator: function(value) {
        return ['Male', 'Female'].includes(value);
      },
      message: props => `${props.value} is not a valid gender`
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: async function(email) {
        // Skip validation for admin users
        if (this.role === 'admin') return true;
        
        const settings = await Setting.findOne();
        if (!settings || !settings.companyName) {
          throw new Error('Company settings not configured');
        }
        
        const domain = `@${settings.companyName.toLowerCase().replace(/\s+/g, '')}.com`;
        return email.endsWith(domain);
      },
      message: props => 'Email domain must match the company domain'
    }
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'team_lead'],
    default: 'employee'
  },
  department: {
    type: String,
    required: true
  },
  position: {
    type: String,
    default: ''
  },
  basicSalary: {
    type: Number,
    required: true,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  phoneNumber: String,
  address: String,
  profileImage: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 