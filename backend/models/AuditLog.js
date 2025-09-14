const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  user_type: {
    type: String,
    required: true,
    enum: ['citizen', 'staff', 'supervisor', 'guest'],
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource_type: {
    type: String,
    required: true,
    enum: ['complaint', 'user', 'department', 'notification', 'system'],
    index: true
  },
  resource_id: {
    type: String,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: String,
  user_agent: String,
  device_id: String,
  department_id: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  success: {
    type: Boolean,
    default: true,
    index: true
  },
  error_message: String,
  session_id: String
}, {
  timestamps: false // We're using our own timestamp field
});

// Compound indexes for common queries
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1, timestamp: -1 });
auditLogSchema.index({ department_id: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Static methods for common audit operations
auditLogSchema.statics.logAction = function(logData) {
  const log = new this({
    user_id: logData.userId,
    user_type: logData.userType,
    action: logData.action,
    resource_type: logData.resourceType,
    resource_id: logData.resourceId,
    details: logData.details || {},
    ip_address: logData.ipAddress,
    user_agent: logData.userAgent,
    device_id: logData.deviceId,
    department_id: logData.departmentId,
    success: logData.success !== false,
    error_message: logData.errorMessage,
    session_id: logData.sessionId
  });
  
  return log.save();
};

auditLogSchema.statics.getComplaintHistory = function(complaintId) {
  return this.find({
    resource_type: 'complaint',
    resource_id: complaintId
  }).sort({ timestamp: -1 });
};

auditLogSchema.statics.getUserActivity = function(userId, limit = 50) {
  return this.find({ user_id: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

auditLogSchema.statics.getDepartmentActivity = function(departmentId, limit = 100) {
  return this.find({ department_id: departmentId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

auditLogSchema.statics.getSystemStats = function(startDate, endDate) {
  const matchStage = {
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          user_type: '$user_type',
          success: '$success'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          action: '$_id.action',
          user_type: '$_id.user_type'
        },
        total: { $sum: '$count' },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
