const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
  citizen_id: {
    type: String,
    required: function() { return this.profileComplete; },
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: function() { return this.profileComplete; }
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    index: true,
    default: null
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  address: {
    type: String,
    required: false
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  complaints_filed: [{
    type: String, // complaint_id references
    required: true
  }],
  upvotes_given: [{
    type: String, // complaint_id references
    required: true
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

// Indexes
citizenSchema.index({ email: 1, verified: 1 });
citizenSchema.index({ created_at: -1 });

// Instance methods
citizenSchema.methods.fileComplaint = function(complaintId) {
  if (!this.complaints_filed.includes(complaintId)) {
    this.complaints_filed.push(complaintId);
  }
  return this.save();
};

citizenSchema.methods.addUpvote = function(complaintId) {
  if (!this.upvotes_given.includes(complaintId)) {
    this.upvotes_given.push(complaintId);
  }
  return this.save();
};

module.exports = mongoose.model('Citizen', citizenSchema);
