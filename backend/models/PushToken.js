const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['citizen', 'staff', 'supervisor'],
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
pushTokenSchema.index({ userId: 1, userType: 1 });
pushTokenSchema.index({ token: 1 });
pushTokenSchema.index({ isActive: 1 });

// Method to deactivate token
pushTokenSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Static method to find active tokens for a user
pushTokenSchema.statics.findActiveTokensForUser = function(userId, userType) {
  return this.find({ 
    userId, 
    userType, 
    isActive: true 
  }).sort({ lastUsed: -1 });
};

// Static method to cleanup old tokens
pushTokenSchema.statics.cleanupOldTokens = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    lastUsed: { $lt: cutoffDate },
    isActive: false
  });
};

const PushToken = mongoose.model('PushToken', pushTokenSchema);

module.exports = PushToken;
