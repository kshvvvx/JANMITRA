const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  unique_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'general'],
    index: true
  },
  state: {
    type: String,
    required: true,
    index: true
  },
  city: {
    type: String,
    required: true,
    index: true
  },
  area: {
    type: String,
    required: true,
    index: true
  },
  phone_numbers: [{
    number: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    designation: String,
    is_primary: {
      type: Boolean,
      default: false
    }
  }],
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  supervisor_id: {
    type: String,
    required: true,
    index: true
  },
  performance_metrics: {
    total_complaints_received: {
      type: Number,
      default: 0
    },
    total_complaints_resolved: {
      type: Number,
      default: 0
    },
    avg_resolution_time: {
      type: Number,
      default: 0 // in hours
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    efficiency_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  banned_numbers: [{
    phone: String,
    reason: String,
    banned_at: {
      type: Date,
      default: Date.now
    },
    banned_by: String
  }],
  logged_in_devices: [{
    device_id: String,
    staff_id: String,
    login_time: {
      type: Date,
      default: Date.now
    },
    is_primary: {
      type: Boolean,
      default: false
    },
    approved_by: String
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes
departmentSchema.index({ state: 1, city: 1, area: 1 });
departmentSchema.index({ category: 1, active: 1 });
departmentSchema.index({ supervisor_id: 1, active: 1 });

// Instance methods
departmentSchema.methods.addComplaint = function() {
  this.performance_metrics.total_complaints_received += 1;
  return this.save();
};

departmentSchema.methods.resolveComplaint = function(resolutionTimeHours) {
  this.performance_metrics.total_complaints_resolved += 1;
  
  // Update average resolution time
  const totalResolved = this.performance_metrics.total_complaints_resolved;
  const currentAvg = this.performance_metrics.avg_resolution_time;
  
  this.performance_metrics.avg_resolution_time = 
    ((currentAvg * (totalResolved - 1)) + resolutionTimeHours) / totalResolved;
  
  // Update efficiency score (resolved/received * 100)
  this.performance_metrics.efficiency_score = 
    (this.performance_metrics.total_complaints_resolved / 
     this.performance_metrics.total_complaints_received) * 100;
  
  return this.save();
};

departmentSchema.methods.banPhoneNumber = function(phone, reason, bannedBy) {
  this.banned_numbers.push({
    phone,
    reason,
    banned_by: bannedBy,
    banned_at: new Date()
  });
  return this.save();
};

departmentSchema.methods.isPhoneBanned = function(phone) {
  return this.banned_numbers.some(banned => banned.phone === phone);
};

departmentSchema.methods.loginDevice = function(deviceId, staffId, isPrimary = false, approvedBy = null) {
  // Remove existing login for this device
  this.logged_in_devices = this.logged_in_devices.filter(device => device.device_id !== deviceId);
  
  this.logged_in_devices.push({
    device_id: deviceId,
    staff_id: staffId,
    login_time: new Date(),
    is_primary: isPrimary,
    approved_by: approvedBy
  });
  
  return this.save();
};

departmentSchema.methods.logoutDevice = function(deviceId) {
  this.logged_in_devices = this.logged_in_devices.filter(device => device.device_id !== deviceId);
  return this.save();
};

departmentSchema.methods.getPrimaryDevice = function() {
  return this.logged_in_devices.find(device => device.is_primary);
};

departmentSchema.methods.getSecondaryDevices = function() {
  return this.logged_in_devices.filter(device => !device.is_primary);
};

module.exports = mongoose.model('Department', departmentSchema);
