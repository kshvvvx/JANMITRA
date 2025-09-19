const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Media schema (images/videos/voice)
 */
const MediaSchema = new Schema({
  url: { type: String, required: true },
  mimeType: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, refPath: 'uploadedByModel' },
  uploadedByModel: { type: String, enum: ['Citizen','Staff','Supervisor','System'], default: 'Citizen' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * History of status updates by staff/citizen
 */
const StatusHistorySchema = new Schema({
  status: { type: String, required: true }, // 'unresolved','in_progress','resolved'
  comment: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, refPath: 'updatedByModel' },
  updatedByModel: { type: String, enum: ['Citizen','Staff','Supervisor','System'] },
  expectedResolutionDate: Date,
  media: [MediaSchema],
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * Refile record when citizen refiles: location is preserved, media must be uploaded again.
 */
const RefileRecordSchema = new Schema({
  refiler: { type: Schema.Types.ObjectId, ref: 'Citizen' },
  media: [MediaSchema],
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * Core Complaint Schema
 */
const complaintSchema = new Schema({
  complaintNumber: { type: String, required: true, unique: true, index: true },
  brief: { type: String }, // AI-generated 7-8 word summary
  description: { type: String },
  descriptionAudioUrl: { type: String }, // optional voice recording URL
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
  },
  address: {
    state: String,
    city: String,
    area: String,
    preciseLocation: String
  },
  media: [MediaSchema], // citizen media when registering
  upvotes: { type: Number, default: 0 },
  upvoters: [{ type: Schema.Types.ObjectId, ref: 'Citizen' }],
  refiles: { type: Number, default: 0 },
  refileRecords: [RefileRecordSchema],
  status: { type: String, enum: ['unresolved','in_progress','resolved'], default: 'unresolved' },
  statusHistory: [StatusHistorySchema],
  resolution: {
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'Staff' },
    comments: String,
    media: [MediaSchema],
    resolvedAt: Date
  },
  dangerFactor: { type: Number, default: 0 }, // assigned by AI
  departmentId: { type: String }, // which department it belongs to
  wardId: { type: String },
  isGuest: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Citizen', default: null },
  isUrgent: { type: Boolean, default: false }, // set by supervisor
  auditLogs: [{
    action: String,
    by: { type: Schema.Types.ObjectId, refPath: 'auditLogs.byModel' },
    byModel: { type: String, enum: ['Citizen','Staff','Supervisor','System'] },
    meta: Schema.Types.Mixed,
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

/**
 * Lightweight complaint-number auto-generator (fallback).
 * Format: JM-<base36-timestamp>-<base36-rand>
 */
complaintSchema.pre('validate', function(next) {
  if (!this.complaintNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random()*1e6).toString(36).toUpperCase();
    this.complaintNumber = `JM-${ts}-${rand}`;
  }
  next();
});

// Add instance methods
complaintSchema.methods.addUpvote = function(citizenId) {
  if (!this.upvoters.includes(citizenId)) {
    this.upvoters.push(citizenId);
    this.upvotes = this.upvoters.length;
    return this.save();
  }
  return Promise.resolve(this);
};

complaintSchema.methods.addAction = function(actionData) {
  this.auditLogs.push(actionData);
  return this.save();
};

complaintSchema.methods.addConfirmation = function(citizenId) {
  return new Promise((resolve, reject) => {
    try {
      // Add confirmation logic here
      this.save()
        .then(updatedComplaint => resolve(updatedComplaint))
        .catch(err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

complaintSchema.methods.addCitizenVote = function(citizenId, vote) {
  return new Promise((resolve, reject) => {
    try {
      // Add voting logic here
      this.save()
        .then(updatedComplaint => resolve(updatedComplaint))
        .catch(err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

complaintSchema.methods.updateStatus = function(newStatus, actorType = 'staff', comment = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    updatedBy: actorType === 'staff' ? this.assignedTo : this.createdBy,
    comment,
    updatedAt: new Date()
  });
  return this.save();
};

// Add static methods
complaintSchema.statics.findByLocation = async function(lat, lng, radiusKm = 5) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    },
    status: { $ne: 'resolved' }
  }).sort({ createdAt: -1 });
};

complaintSchema.statics.generateComplaintId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `COMP-${timestamp}-${random}`.toUpperCase();
};

complaintSchema.statics.autoResolveOldComplaints = async function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.updateMany(
    {
      status: { $ne: 'resolved' },
      updatedAt: { $lt: thirtyDaysAgo },
      'statusHistory.status': { $ne: 'resolved' }
    },
    {
      $set: { status: 'resolved' },
      $push: {
        statusHistory: {
          status: 'resolved',
          updatedBy: null,
          comment: 'Auto-resolved after 30 days of inactivity',
          updatedAt: new Date()
        }
      }
    }
  );
};

module.exports = mongoose.model('Complaint', complaintSchema);
