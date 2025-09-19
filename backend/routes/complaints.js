// Complaint management routes with role-based access control
// Handles CRUD operations for complaints with role-based authorization

const express = require('express');
const router = express.Router();
const { Complaint } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { 
  checkDepartmentAccess, 
  checkDuplicateComplaint,
  validateMedia,
  validateStatusUpdate,
  validateRefile,
  createComplaintValidation,
  updateStatusValidation,
  refileValidation
} = require('../middleware/complaintValidation');
const { 
  cacheMiddleware, 
  invalidateCache, 
  keyBuilders, 
  invalidationPatterns 
} = require('../middleware/cacheMiddleware');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Role-based access control middleware
 * @param {string|string[]} allowedRoles - Role or array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Convert single role to array for uniform handling
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Check if user is authenticated and has a role
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        details: 'User role not found in request'
      });
    }
    
    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        details: `This endpoint requires one of these roles: ${roles.join(', ')}`
      });
    }
    
    // User has required role, proceed to the next middleware
    next();
  };
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'complaints',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Create a new complaint (citizens only)
// Create a new complaint
router.post('/', 
  authenticateToken, 
  requireRole('citizen'),
  validateMedia,
  checkDuplicateComplaint,
  createComplaintValidation,
  invalidateCache(invalidationPatterns.allComplaints),
  invalidateCache((req) => invalidationPatterns.userComplaints(req)),
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
  try {
    const { description, descriptionAudioUrl, media = [], location } = req.body;

    // Validate required fields
    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required',
        field: 'description'
      });
    }

    if (!location || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Valid location with coordinates [lng, lat] is required',
        field: 'location'
      });
    }

    // Prepare complaint data
    const complaintData = {
      description,
      descriptionAudioUrl: descriptionAudioUrl || undefined,
      media: media.map(m => ({
        url: m.url,
        mimeType: m.mimeType || 'application/octet-stream',
        uploadedBy: req.user._id,
        uploadedByModel: 'Citizen'
      })),
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(location.coordinates[0]), // lng
          parseFloat(location.coordinates[1])  // lat
        ]
      },
      address: {
        state: location.state || '',
        city: location.city || '',
        area: location.area || '',
        preciseLocation: location.preciseLocation || ''
      },
      brief: 'Complaint registered', // Default brief as per requirements
      createdBy: req.user._id,
      auditLogs: [{
        action: 'create',
        by: req.user._id,
        byModel: 'Citizen',
        at: new Date(),
        meta: {
          descriptionLength: description.length,
          hasAudio: !!descriptionAudioUrl,
          mediaCount: media.length
        }
      }]
    };

    // Save to database
    const complaint = new Complaint(complaintData);
    await complaint.save();

    // Prepare response
    const response = {
      success: true,
      message: 'Complaint created successfully',
      data: {
        id: complaint._id,
        complaintNumber: complaint.complaintNumber,
        status: complaint.status,
        description: complaint.description,
        brief: complaint.brief,
        location: complaint.location,
        address: complaint.address,
        createdAt: complaint.createdAt,
        media: complaint.media.map(m => ({
          url: m.url,
          mimeType: m.mimeType
        }))
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create complaint',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user's complaints (citizens only)
// Get all complaints for the logged-in citizen
router.get('/mine', 
  authenticateToken, 
  requireRole('citizen'),
  cacheMiddleware((req) => keyBuilders.citizenComplaints(req)),
  async (req, res) => {
    try {
      const { status } = req.query;
      
      // Build query
    const query = { createdBy: req.user._id };
    
    // Add status filter if provided
    if (status && ['unresolved', 'resolved', 'in_progress'].includes(status)) {
      query.status = status;
    }
    
    // Fetch complaints with lean() for better performance
    const complaints = await Complaint.find(query)
      .select('complaintNumber brief status createdAt upvotes refiles location.address')
      .sort({ createdAt: -1 }) // Newest first
      .lean();
    
    // Transform the data to match the required format
    const formattedComplaints = complaints.map(complaint => ({
      complaintNumber: complaint.complaintNumber,
      brief: complaint.brief || 'Complaint registered',
      status: complaint.status,
      createdAt: complaint.createdAt,
      upvotes: complaint.upvotes || 0,
      refiles: complaint.refiles || 0,
      location: {
        address: {
          state: complaint.address?.state || '',
          city: complaint.address?.city || '',
          area: complaint.address?.area || '',
          preciseLocation: complaint.address?.preciseLocation || ''
        }
      }
    }));
    
    res.status(200).json({
      success: true,
      count: formattedComplaints.length,
      complaints: formattedComplaints
    });
    
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complaints',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all complaints (staff only)
// Get all complaints (staff view)
router.get('/', 
  authenticateToken, 
  requireRole('staff'), 
  checkDepartmentAccess,
  cacheMiddleware((req) => keyBuilders.staffComplaints(req)),
  async (req, res) => {
    try {
      // Extract query parameters with defaults
      const { 
        status = 'unresolved', 
        page = 1, 
        limit = 10,
        sort = 'createdAt',
        order = 'desc'
      } = req.query;
      
      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;
      
      // Build query
      const query = { status };

      // Validate status
      if (!['unresolved', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: unresolved, in_progress, resolved'
        });
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build base query
    const query = { status };

    // Get total count for pagination
    const totalCount = await Complaint.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Fetch paginated complaints with sorting and field selection
    const complaints = await Complaint.find(query)
      .select('complaintNumber brief status createdAt upvotes refiles isUrgent dangerFactor location.address')
      .sort({ 
        dangerFactor: -1,  // Highest first
        upvotes: -1,       // Then most upvoted
        createdAt: 1       // Then oldest first
      })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format the response
    const formattedComplaints = complaints.map(complaint => ({
      complaintNumber: complaint.complaintNumber,
      brief: complaint.brief || 'Complaint registered',
      status: complaint.status,
      createdAt: complaint.createdAt,
      upvotes: complaint.upvotes || 0,
      refiles: complaint.refiles || 0,
      isUrgent: !!complaint.isUrgent,
      dangerFactor: complaint.dangerFactor || 0,
      location: {
        address: {
          state: complaint.address?.state || '',
          city: complaint.address?.city || '',
          area: complaint.address?.area || '',
          preciseLocation: complaint.address?.preciseLocation || ''
        }
      }
    }));

    res.status(200).json({
      success: true,
      complaints: formattedComplaints,
      page: pageNum,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complaints',
      details: error.message
    });
  }
});

// Refile a complaint (citizens only)
// Refile a complaint
router.post('/:id/refile', 
  authenticateToken, 
  requireRole('citizen'),
  validateRefile,
  refileValidation,
  invalidateCache(invalidationPatterns.allComplaints),
  invalidateCache((req) => invalidationPatterns.complaintById(req)),
  invalidateCache((req) => invalidationPatterns.userComplaints(req)),
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
  try {
    const { id } = req.params;
    const { description, media = [], note } = req.body;

    // Validate media is provided and is an array
    if (!Array.isArray(media) || media.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'New media required for refiling',
        field: 'media'
      });
    }

    // Validate each media item
    for (const [index, item] of media.entries()) {
      if (!item.url) {
        return res.status(400).json({
          success: false,
          error: `Media item at index ${index} is missing required field 'url'`,
          field: `media[${index}].url`
        });
      }
    }

    // Find the complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Update description if provided
    if (description) {
      complaint.description = description;
    }

    // Prepare media with required fields
    const refileMedia = media.map(item => ({
      url: item.url,
      mimeType: item.mimeType || 'application/octet-stream',
      uploadedBy: req.user._id,
      uploadedByModel: 'Citizen'
    }));

    // Add refile record
    const refileRecord = {
      refiler: req.user._id,
      media: refileMedia,
      note: note || undefined,
      createdAt: new Date()
    };

    // Update complaint
    complaint.refiles = (complaint.refiles || 0) + 1;
    complaint.refileRecords.push(refileRecord);
    complaint.status = 'unresolved';
    
    // Add to status history
    complaint.statusHistory.push({
      status: 'unresolved',
      comment: 'Complaint refiled by citizen',
      updatedBy: req.user._id,
      updatedByModel: 'Citizen',
      media: refileMedia,
      createdAt: new Date()
    });

    // Add audit log
    complaint.auditLogs.push({
      action: 'refile',
      by: req.user._id,
      byModel: 'Citizen',
      at: new Date(),
      meta: {
        refileCount: complaint.refiles,
        mediaCount: media.length,
        note: note ? true : false
      }
    });

    // Save the updated complaint
    await complaint.save();

    // Prepare response
    res.status(200).json({
      success: true,
      message: 'Complaint refiled successfully',
      data: {
        complaintNumber: complaint.complaintNumber,
        refiles: complaint.refiles,
        status: complaint.status,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error refiling complaint:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message
      });
    }
    
    // Handle cast errors (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid complaint ID format'
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      error: 'Failed to refile complaint',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update complaint status (staff only)
// Update complaint status
router.patch('/:id/status', 
  authenticateToken, 
  requireRole('staff'),
  checkDepartmentAccess,
  validateStatusUpdate,
  updateStatusValidation,
  invalidateCache(invalidationPatterns.allComplaints),
  invalidateCache((req) => invalidationPatterns.complaintById(req)),
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
  try {
    const { id } = req.params;
    const { status, comment, expectedResolutionDate, media = [] } = req.body;
    
    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status value
    if (!['unresolved', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: unresolved, in_progress, resolved'
      });
    }

    // Find the complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Prepare status update data
    const statusUpdate = {
      status,
      comment: comment || undefined,
      updatedBy: req.user._id,
      updatedByModel: 'Staff',
      expectedResolutionDate: expectedResolutionDate ? new Date(expectedResolutionDate) : undefined,
      media: media.map(m => ({
        url: m.url,
        mimeType: m.mimeType || 'application/octet-stream',
        uploadedBy: req.user._id,
        uploadedByModel: 'Staff'
      })),
      createdAt: new Date()
    };

    // Update complaint status and history
    complaint.statusHistory.push(statusUpdate);
    
    // Handle resolution if status is 'resolved'
    if (status === 'resolved') {
      complaint.status = 'resolved';
      complaint.resolution = {
        resolvedBy: req.user._id,
        comments: comment,
        media: statusUpdate.media,
        resolvedAt: new Date()
      };
    } else {
      complaint.status = status;
    }

    // Add audit log
    complaint.auditLogs.push({
      action: 'status_update',
      by: req.user._id,
      byModel: 'Staff',
      at: new Date(),
      meta: { status, comment: comment || null }
    });

    // Save the updated complaint
    await complaint.save();

    // Prepare response
    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      complaintId: complaint._id,
      newStatus: status,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error updating complaint status:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.message
      });
    }
    
    // Handle cast errors (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid complaint ID format'
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      error: 'Failed to update complaint status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Supervisor dashboard (supervisors only)
router.get('/supervisor', authenticateToken, requireRole('supervisor'), (req, res) => {
  const dashboardData = {
    stats: {
      totalComplaints: 42,
      openComplaints: 15,
      inProgress: 8,
      resolved: 19,
      resolutionRate: '76.2%'
    },
    recentActivity: [
      { id: 1, action: 'Complaint resolved', complaintId: 'COMP-42', timestamp: new Date() },
      { id: 2, action: 'New complaint submitted', complaintId: 'COMP-43', timestamp: new Date() }
    ]
  };

  res.status(200).json({
    success: true,
    message: 'Supervisor dashboard data',
    data: dashboardData
  });
});

// Export the router to be mounted in the main app
module.exports = router;
