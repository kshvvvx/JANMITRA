const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
  supervisor_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  departments: [{
    type: String,
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'general'],
    required: true
  }],
  role: {
    type: String,
    required: true,
    enum: ['supervisor', 'senior_supervisor', 'district_head'],
    default: 'supervisor'
  },
  phone: {
    type: String,
    required: false
  },
  assigned_districts: [{
    type: String,
    required: true
  }],
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  supervised_staff: [{
    staff_id: String,
    department: String,
    assigned_at: {
      type: Date,
      default: Date.now
    }
  }],
  oversight_metrics: {
    total_complaints_overseen: {
      type: Number,
      default: 0
    },
    escalated_complaints: {
      type: Number,
      default: 0
    },
    resolved_complaints: {
      type: Number,
      default: 0
    },
    avg_oversight_time: {
      type: Number,
      default: 0 // in hours
    },
    performance_rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  permissions: {
    can_reassign_staff: {
      type: Boolean,
      default: true
    },
    can_escalate_complaints: {
      type: Boolean,
      default: true
    },
    can_override_status: {
      type: Boolean,
      default: false
    },
    can_access_analytics: {
      type: Boolean,
      default: true
    }
  },
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
supervisorSchema.index({ departments: 1, active: 1 });
supervisorSchema.index({ role: 1, active: 1 });
supervisorSchema.index({ assigned_districts: 1 });
supervisorSchema.index({ 'oversight_metrics.performance_rating': -1 });

// Instance methods
supervisorSchema.methods.assignStaff = function(staffId, department) {
  const existingAssignment = this.supervised_staff.find(s => s.staff_id === staffId);
  if (!existingAssignment) {
    this.supervised_staff.push({
      staff_id: staffId,
      department: department,
      assigned_at: new Date()
    });
  }
  return this.save();
};

supervisorSchema.methods.escalateComplaint = function(complaintId, reason) {
  this.oversight_metrics.escalated_complaints += 1;
  return this.save();
};

supervisorSchema.methods.overseeComplaint = function(complaintId) {
  this.oversight_metrics.total_complaints_overseen += 1;
  return this.save();
};

supervisorSchema.methods.markComplaintResolved = function(complaintId) {
  this.oversight_metrics.resolved_complaints += 1;
  return this.save();
};

// Static methods
supervisorSchema.statics.findByDepartment = function(department) {
  return this.find({
    departments: department,
    active: true
  });
};

supervisorSchema.statics.findByDistrict = function(district) {
  return this.find({
    assigned_districts: district,
    active: true
  });
};

module.exports = mongoose.model('Supervisor', supervisorSchema);
