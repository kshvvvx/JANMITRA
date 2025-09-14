const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staff_id: {
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
  department: {
    type: String,
    required: true,
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'general'],
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['staff', 'senior_staff', 'department_head'],
    default: 'staff'
  },
  phone: {
    type: String,
    required: false
  },
  assigned_area: {
    type: String,
    required: false
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  complaints_handled: [{
    complaint_id: String,
    status: {
      type: String,
      enum: ['assigned', 'in-progress', 'resolved']
    },
    assigned_at: {
      type: Date,
      default: Date.now
    },
    resolved_at: Date
  }],
  performance_metrics: {
    total_assigned: {
      type: Number,
      default: 0
    },
    total_resolved: {
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
staffSchema.index({ department: 1, active: 1 });
staffSchema.index({ role: 1, department: 1 });
staffSchema.index({ 'performance_metrics.rating': -1 });

// Instance methods
staffSchema.methods.assignComplaint = function(complaintId) {
  this.complaints_handled.push({
    complaint_id: complaintId,
    status: 'assigned',
    assigned_at: new Date()
  });
  this.performance_metrics.total_assigned += 1;
  return this.save();
};

staffSchema.methods.resolveComplaint = function(complaintId) {
  const complaint = this.complaints_handled.find(c => c.complaint_id === complaintId);
  if (complaint) {
    complaint.status = 'resolved';
    complaint.resolved_at = new Date();
    this.performance_metrics.total_resolved += 1;
    
    // Calculate resolution time in hours
    const resolutionTime = (complaint.resolved_at - complaint.assigned_at) / (1000 * 60 * 60);
    this.updateAverageResolutionTime(resolutionTime);
  }
  return this.save();
};

staffSchema.methods.updateAverageResolutionTime = function(newResolutionTime) {
  const totalResolved = this.performance_metrics.total_resolved;
  const currentAvg = this.performance_metrics.avg_resolution_time;
  
  this.performance_metrics.avg_resolution_time = 
    ((currentAvg * (totalResolved - 1)) + newResolutionTime) / totalResolved;
};

module.exports = mongoose.model('Staff', staffSchema);
