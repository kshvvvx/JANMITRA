const { body, param, query } = require('express-validator');
const { Complaint } = require('../models');
const mongoose = require('mongoose');

// Allowed media types and max size (10MB)
const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'video/mp4',
  'audio/mpeg',
  'audio/wav'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Check if user is from the same department as complaint
const checkDepartmentAccess = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    if (complaint.departmentId !== req.user.departmentId) {
      return res.status(403).json({ 
        error: 'Access denied: You do not have permission to update this complaint' 
      });
    }
    
    req.complaint = complaint;
    next();
  } catch (error) {
    next(error);
  }
};

// Check for duplicate complaints
const checkDuplicateComplaint = async (req, res, next) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const existingComplaint = await Complaint.findOne({
      createdBy: req.user._id,
      'location.coordinates': req.body.location.coordinates,
      description: req.body.description,
      createdAt: { $gte: thirtyMinutesAgo }
    });

    if (existingComplaint) {
      return res.status(409).json({
        error: 'A similar complaint was already submitted recently',
        complaintId: existingComplaint._id,
        submittedAt: existingComplaint.createdAt
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Validate media uploads
const validateMedia = (req, res, next) => {
  if (!req.body.media || !Array.isArray(req.body.media)) {
    return next();
  }

  for (const [index, media] of req.body.media.entries()) {
    // Check file type
    if (!ALLOWED_MEDIA_TYPES.includes(media.mimeType)) {
      return res.status(400).json({
        error: `Invalid file type for media at index ${index}. Allowed types: ${ALLOWED_MEDIA_TYPES.join(', ')}`
      });
    }
    
    // Check file size (assuming URL points to a file that was already uploaded)
    // In a real app, you'd validate the actual file size during upload
  }
  
  next();
};

// Validate complaint status transition
const validateStatusUpdate = async (req, res, next) => {
  const { status } = req.body;
  const complaint = req.complaint || await Complaint.findById(req.params.id);
  
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if status is being set to resolved
  if (status === 'resolved') {
    // Check if there's at least one progress update
    const hasProgress = complaint.statusHistory.some(
      entry => entry.status === 'in_progress'
    );
    
    if (!hasProgress) {
      return res.status(400).json({
        error: 'Cannot mark as resolved without any progress updates'
      });
    }
  }
  
  req.complaint = complaint;
  next();
};

// Validate refile request
const validateRefile = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check if complaint is already with supervisor
    if (complaint.status === 'escalated') {
      return res.status(400).json({
        error: 'Cannot refile an escalated complaint. Please wait for supervisor review.'
      });
    }

    // Check if user has already refiled in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRefile = complaint.refileRecords.some(
      record => record.refiler.equals(req.user._id) && record.createdAt > sevenDaysAgo
    );

    if (recentRefile) {
      return res.status(429).json({
        error: 'You can only refile a complaint once every 7 days'
      });
    }

    req.complaint = complaint;
    next();
  } catch (error) {
    next(error);
  }
};

// Express-validator chains
const createComplaintValidation = [
  body('description').notEmpty().withMessage('Description is required'),
  body('location').isObject().withMessage('Valid location object is required'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('media').optional().isArray().withMessage('Media must be an array')
];

const updateStatusValidation = [
  body('status')
    .isIn(['unresolved', 'in_progress', 'resolved'])
    .withMessage('Invalid status value')
];

const refileValidation = [
  body('media')
    .isArray({ min: 1 })
    .withMessage('At least one media file is required for refiling'),
  body('description').optional().trim().notEmpty()
];

module.exports = {
  checkDepartmentAccess,
  checkDuplicateComplaint,
  validateMedia,
  validateStatusUpdate,
  validateRefile,
  createComplaintValidation,
  updateStatusValidation,
  refileValidation
};
