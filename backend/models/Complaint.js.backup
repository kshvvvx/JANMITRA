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
  confirmations: [{
    citizen_id: {
      type: String,
      required: true
    },
    confirmed_at: {
      type: Date,
      default: Date.now
    }
  }],
  citizen_votes: [{
    citizen_id: {
      type: String,
      required: true
    },
    vote: {
      type: String,
      enum: ['yes', 'refile'],
      required: true
    },
    voted_at: {
      type: Date,
      default: Date.now
    }
  }],
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
    required: true,
    enum: ['unresolved', 'in-progress', 'awaiting_confirmation', 'awaiting_citizen_confirmation', 'resolved'],
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
  citizen_votes: [{
    citizen_id: {
      type: String,
      required: true
    },
    vote: {
      type: String,
      enum: ['yes', 'refile'],
      required: true
    },
    voted_at: {
      type: Date,
      default: Date.now
    }
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

complaintSchema.methods.addConfirmation = async function(citizenId) {
  // Check if citizen already confirmed
  const existingConfirmation = this.confirmations.find(
    conf => conf.citizen_id === citizenId
  );
  
  if (existingConfirmation) {
    throw new Error('Citizen has already confirmed this resolution');
  }
  
  // Add confirmation
  this.confirmations.push({ citizen_id: citizenId });
  
  // Log action
  this.actions.push({
    type: 'citizen_confirmation',
    performed_by: citizenId,
    details: {
      confirmation_count: this.confirmations.length
    }
  });
  
  return this.save();
};

complaintSchema.methods.addCitizenVote = async function(citizenId, vote) {
  // Check if citizen already voted
  const existingVote = this.citizen_votes.find(
    v => v.citizen_id === citizenId
  );
  
  if (existingVote) {
    throw new Error('Citizen has already voted on this complaint');
  }
  
  // Add vote
  this.citizen_votes.push({ 
    citizen_id: citizenId, 
    vote: vote 
  });
  
  // Log action
  this.actions.push({
    type: 'citizen_vote',
    performed_by: citizenId,
    details: {
      vote: vote,
      total_yes_votes: this.citizen_votes.filter(v => v.vote === 'yes').length,
      total_refile_votes: this.citizen_votes.filter(v => v.vote === 'refile').length
    }
  });
  
  // Handle refile vote
  if (vote === 'refile') {
    this.status = 'unresolved';
    this.resolved_at = null;
    this.refiles.push({
      refiled_by: citizenId,
      reason: 'Citizen voted to refile - issue not actually resolved'
    });
    
    this.actions.push({
      type: 'refiled',
      performed_by: citizenId,
      details: {
        reason: 'Citizen refile vote',
        previous_status: 'awaiting_citizen_confirmation'
      }
    });
  }
  
  // Check for 3 "yes" votes to actually resolve
  const yesVotes = this.citizen_votes.filter(v => v.vote === 'yes').length;
  if (yesVotes >= 3 && this.status === 'awaiting_citizen_confirmation') {
    this.status = 'resolved';
    this.resolved_at = new Date();
    this.upvotes = []; // Reset upvotes as per requirement
    
    this.actions.push({
      type: 'citizen_confirmed_resolved',
      performed_by: 'system',
      details: {
        reason: 'Three or more citizens confirmed resolution',
        yes_votes: yesVotes
      }
    });
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

// Static method to auto-resolve old complaints
complaintSchema.statics.autoResolveOldComplaints = async function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // Auto-resolve complaints awaiting citizen confirmation for over a week
  const oldComplaints = await this.find({
    status: 'awaiting_citizen_confirmation',
    created_at: { $lte: oneWeekAgo }
  });
  
  const results = [];
  
  for (const complaint of oldComplaints) {
    complaint.status = 'resolved';
    complaint.resolved_at = new Date();
    complaint.upvotes = []; // Reset upvotes
    
    complaint.actions.push({
      type: 'auto_resolved',
      performed_by: 'system',
      details: {
        reason: 'Auto-resolved after 7 days without sufficient citizen confirmations',
        age_days: Math.floor((new Date() - complaint.created_at) / (1000 * 60 * 60 * 24)),
        yes_votes: complaint.citizen_votes.filter(v => v.vote === 'yes').length
      }
    });
    
    await complaint.save();
    results.push(complaint.complaint_id);
  }
  
  return results;
};

module.exports = mongoose.model('Complaint', complaintSchema);
