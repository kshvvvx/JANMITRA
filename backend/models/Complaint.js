const mongoose = require('mongoose');

// Media subdocument schema
const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, { _id: false });

// Location subdocument schema
const locationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: false
  },
  lng: {
    type: Number,
    required: false
  },
  address: {
    type: String,
    required: true
  }
}, { _id: false });

// Action subdocument schema for tracking complaint history
const actionSchema = new mongoose.Schema({
  actorType: {
    type: String,
    enum: ['citizen', 'staff', 'supervisor'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  comment: {
    type: String,
    required: false
  },
  media: [mediaSchema]
}, { _id: false });

// Refile subdocument schema
const refileSchema = new mongoose.Schema({
  citizen_id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  media: [mediaSchema],
  location: locationSchema,
  created_at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Main Complaint schema
const complaintSchema = new mongoose.Schema({
  complaint_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  citizen_id: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: locationSchema,
    required: true,
    index: '2dsphere' // Geospatial index for location queries
  },
  media: [mediaSchema],
  status: {
    type: String,
    enum: ['unresolved', 'in-progress', 'awaiting_confirmation', 'resolved'],
    default: 'unresolved',
    index: true
  },
  upvotes: [{
    type: String, // citizen_id of upvoters
    required: true
  }],
  refiles: [refileSchema],
  dangerScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  actions: [actionSchema],
  confirmations: [{
    type: String, // citizen_id of confirmers
    required: true
  }],
  resolved_at: {
    type: Date,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: -1 // Descending index for recent complaints first
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Create compound indexes
complaintSchema.index({ citizen_id: 1, status: 1 });
complaintSchema.index({ status: 1, created_at: -1 });
complaintSchema.index({ dangerScore: -1, created_at: -1 });

// Create 2dsphere index for geospatial queries
complaintSchema.index({ 'location.lat': 1, 'location.lng': 1 });

// Pre-save middleware to update timestamps
complaintSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance methods
complaintSchema.methods.addUpvote = function(citizenId) {
  if (!this.upvotes.includes(citizenId)) {
    this.upvotes.push(citizenId);
  }
  return this.save();
};

complaintSchema.methods.addAction = function(actionData) {
  this.actions.push({
    ...actionData,
    timestamp: new Date()
  });
  return this.save();
};

complaintSchema.methods.addConfirmation = function(citizenId) {
  if (!this.confirmations.includes(citizenId)) {
    this.confirmations.push(citizenId);
    
    // Add action log
    this.actions.push({
      actorType: 'citizen',
      action: 'confirmed_resolution',
      timestamp: new Date(),
      comment: `Citizen confirmed resolution (${this.confirmations.length} confirmations)`
    });
    
    // Auto-resolve if 3+ confirmations
    if (this.confirmations.length >= 3) {
      this.status = 'resolved';
      this.resolved_at = new Date();
      this.upvotes = []; // Reset upvotes as requested
      
      this.actions.push({
        actorType: 'system',
        action: 'auto_resolved',
        timestamp: new Date(),
        comment: 'Automatically resolved after 3+ citizen confirmations'
      });
    }
  }
  return this.save();
};

complaintSchema.methods.updateStatus = function(newStatus, actorType = 'staff', comment = '') {
  this.status = newStatus;
  this.addAction({
    actorType,
    action: 'status_updated',
    comment: comment || `Status changed to ${newStatus}`
  });
  return this.save();
};

// Static methods
complaintSchema.statics.findByLocation = function(lat, lng, radiusKm = 5) {
  return this.find({
    'location.lat': { $exists: true },
    'location.lng': { $exists: true },
    $expr: {
      $lte: [
        {
          $multiply: [
            6371, // Earth's radius in km
            {
              $acos: {
                $add: [
                  {
                    $multiply: [
                      { $sin: { $multiply: [{ $degreesToRadians: lat }, 1] } },
                      { $sin: { $multiply: [{ $degreesToRadians: '$location.lat' }, 1] } }
                    ]
                  },
                  {
                    $multiply: [
                      { $cos: { $multiply: [{ $degreesToRadians: lat }, 1] } },
                      { $cos: { $multiply: [{ $degreesToRadians: '$location.lat' }, 1] } },
                      { $cos: { $multiply: [{ $degreesToRadians: { $subtract: ['$location.lng', lng] } }, 1] } }
                    ]
                  }
                ]
              }
            }
          ]
        },
        radiusKm
      ]
    }
  });
};

complaintSchema.statics.generateComplaintId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `COMP-${timestamp}-${random}`.toUpperCase();
};

// Static method to auto-resolve old awaiting_confirmation complaints
complaintSchema.statics.autoResolveOldComplaints = function() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return this.updateMany(
    {
      status: 'awaiting_confirmation',
      updated_at: { $lt: sevenDaysAgo }
    },
    {
      $set: {
        status: 'resolved',
        resolved_at: new Date()
      },
      $push: {
        actions: {
          actorType: 'system',
          action: 'auto_resolved',
          timestamp: new Date(),
          comment: 'Automatically resolved after 7 days in awaiting_confirmation status'
        }
      }
    }
  );
};

module.exports = mongoose.model('Complaint', complaintSchema);
