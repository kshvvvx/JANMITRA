// Complaint management routes with role-based access control
// Handles CRUD operations for complaints with role-based authorization

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Complaint, Citizen } = require('../models');
const { calculateDistance } = require('../utils/geo');
const { authenticateToken, requireRole, requireCitizen, requireStaff, requireSupervisor, requireStaffOrSupervisor } = require('../middleware/auth');
const { notifyComplaintStatusChange, notifyComplaintUpvoted, notifyStaffNewComplaint } = require('../utils/notifications');
const { uploadMultiple, handleUploadError, processUploadedFiles } = require('../middleware/upload');
const { v4: uuidv4 } = require('uuid');

// AI Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_REQUEST_TIMEOUT = 5000; // 5 seconds

/**
 * Call AI service to analyze complaint
 * @param {Object} complaintData - Complaint data to analyze
 * @returns {Promise<Object>} AI analysis results
 */
async function analyzeComplaintWithAI(complaintData) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/ai/analyze`,
      {
        description: complaintData.description,
        category: complaintData.category,
        location: complaintData.location,
        media_type: complaintData.media_type,
        media_count: complaintData.media?.length || 0,
        language: complaintData.language || 'en'
      },
      { 
        timeout: AI_REQUEST_TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    // Return default values if AI service is unavailable
    return {
      danger_score: 5.0,
      risk_level: 'medium',
      auto_description: complaintData.description.substring(0, 150) + '...',
      sentiment: 'neutral',
      is_duplicate: false,
      similar_complaints: []
    };
  }
}

/**
 * Find similar existing complaints
 * @param {Object} complaintData - New complaint data
 * @returns {Promise<Array>} List of similar complaints
 */
async function findSimilarComplaints(complaintData) {
  try {
    // Search for similar complaints in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Basic text similarity search (can be enhanced with vector search)
    const keywords = complaintData.description
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const query = {
      $or: [
        { description: { $regex: keywords.join('|'), $options: 'i' } },
        { category: complaintData.category }
      ],
      status: { $ne: 'resolved' },
      createdAt: { $gte: thirtyDaysAgo }
    };

    if (complaintData.location) {
      // Add location-based filtering (within 1km radius)
      const { lat, lng } = complaintData.location;
      if (lat && lng) {
        query['location.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat] // MongoDB uses [longitude, latitude] order
            },
            $maxDistance: 1000, // 1km radius
            $minDistance: 0
          }
        };
      }
    }

    return await Complaint.find(query)
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(5)
      .lean();
  } catch (error) {
    console.error('Error finding similar complaints:', error);
    return [];
  }
}

// Create a new complaint with AI integration (citizens only)
router.post('/', authenticateToken, requireRole(['citizen']), (req, res, next) => {
  // Skip multer for JSON requests
  if (req.headers['content-type'] === 'application/json') {
    return next();
  }
  uploadMultiple(req, res, next);
}, handleUploadError, async (req, res) => {
  try {
    // Handle both JSON and multipart form data
    const description = req.body.description;
    const category = req.body.category;
    const location = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
    const language = req.body.language || 'en';
    
    // Use authenticated citizen's ID
    const citizen_id = req.user.userId;
    
    // Process media files if any
    const media = req.files ? await processUploadedFiles(req.files) : [];
    
    // Prepare complaint data for AI analysis
    const complaintData = {
      description,
      category,
      location,
      media_type: media.length > 0 ? media[0].type : 'none',
      media_count: media.length,
      language
    };
    
    // Get AI analysis in parallel with file processing
    const [aiAnalysis, similarComplaints] = await Promise.all([
      analyzeComplaintWithAI(complaintData),
      findSimilarComplaints(complaintData)
    ]);
    
    // Log AI analysis for debugging
    console.log('AI Analysis:', JSON.stringify(aiAnalysis, null, 2));
    
    // If similar complaints found, consider this a potential duplicate
    const isPotentialDuplicate = similarComplaints.length > 0 && 
                               (aiAnalysis.is_duplicate || similarComplaints.length >= 2);

    // Enhanced location validation
    if (!description || !location) {
      return res.status(400).json({
        error: 'Missing required fields: description and location are required'
      });
    }

    // Validate location has required fields
    if (!location.address) {
      return res.status(400).json({
        error: 'Location must include an address'
      });
    }

    // For GPS locations, validate coordinates
    if (location.lat !== null && location.lng !== null) {
      if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return res.status(400).json({
          error: 'Invalid GPS coordinates: lat and lng must be numbers'
        });
      }
      
      // Validate coordinate ranges
      if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
        return res.status(400).json({
          error: 'Invalid GPS coordinates: lat must be between -90 and 90, lng must be between -180 and 180'
        });
      }
    }

    // Process uploaded media files
    const mediaFiles = processUploadedFiles(req, req.files || []);

    // Generate complaint ID
    const complaint_id = Complaint.generateComplaintId();

    // AI Analysis (if AI service is available)
    let aiAnalysis = null;
    let finalCategory = category || 'other';
    let dangerScore = 0;
    let duplicates = [];

    try {
      // Prepare data for AI service
      const aiRequestData = {
        description,
        category: category || 'other',
        location: {
          latitude: location.lat,
          longitude: location.lng
        },
        media_count: mediaFiles ? mediaFiles.length : 0,
        upvotes: 0 // New complaints start with 0 upvotes
      };
      
      console.log('Sending to AI service:', JSON.stringify(aiRequestData, null, 2));
      
      // Call AI service for danger score
      const dangerScoreResponse = await fetch('http://localhost:8000/api/ai/danger-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiRequestData)
      });

      if (dangerScoreResponse.ok) {
        const dangerData = await dangerScoreResponse.json();
        dangerScore = dangerData.score || 0;
        finalCategory = dangerData.risk_level || category || 'other';
        
        console.log(`AI Danger Score for ${complaint_id}:`, {
          score: dangerScore,
          risk_level: finalCategory,
          factors: dangerData.factors || []
        });
      }
    } catch (aiError) {
      console.warn('AI service unavailable, using fallback categorization:', aiError.message);
    }

    // Create new complaint with AI-enhanced data
    const complaint = new Complaint({
      _id: `COMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      citizen_id,
      description: aiAnalysis.auto_description || description,
      original_description: description, // Store original for reference
      category,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
        address: location.address,
        geohash: '' // Will be set by pre-save hook
      },
      status: isPotentialDuplicate ? 'pending_review' : 'pending',
      upvotes: 0,
      media: media.map(file => ({
        url: file.path,
        type: file.type,
        thumbnail: file.thumbnail,
        size: file.size,
        uploaded_at: new Date()
      })),
      ai_analysis: {
        danger_score: aiAnalysis.danger_score || 0,
        risk_level: aiAnalysis.risk_level || 'medium',
        sentiment: aiAnalysis.sentiment || 'neutral',
        is_duplicate: aiAnalysis.is_duplicate || false,
        similar_complaints: similarComplaints.map(c => ({
          id: c._id,
          similarity: 0.8, // This would come from vector similarity in production
          reason: 'Similar description and location'
        })),
        analyzed_at: new Date()
      },
      priority: calculatePriority(aiAnalysis.danger_score, aiAnalysis.risk_level),
      actions: [{
        action: isPotentialDuplicate ? 'created_as_duplicate' : 'created',
        by: citizen_id,
        at: new Date(),
        comment: isPotentialDuplicate 
          ? 'Complaint created (possible duplicate)' 
          : 'Complaint created',
        metadata: {
          ai_generated: true,
          risk_level: aiAnalysis.risk_level,
          similar_complaints_count: similarComplaints.length
        }
      }]
    });
    
    // If similar complaints found, link them
    if (similarComplaints.length > 0) {
      complaint.related_complaints = similarComplaints.map(c => ({
        complaint_id: c._id,
        relation_type: 'similar',
        confidence: 0.8, // Would come from vector similarity
        created_at: new Date()
      }));
    }

    try {
      await complaint.save();
      console.log('Complaint saved successfully:', complaint.complaint_id);

      // Notify staff about new complaint
      try {
        await notifyStaffNewComplaint(complaint);
        console.log('Staff notification sent for complaint:', complaint.complaint_id);
      } catch (notifyError) {
        console.error('Error sending staff notification:', notifyError);
        // Continue even if notification fails
      }

      // Update citizen's complaints_filed array
      try {
        await Citizen.findOneAndUpdate(
          { citizen_id },
          { 
            $addToSet: { complaints_filed: complaint_id },
            $setOnInsert: { 
              citizen_id,
              name: `User ${citizen_id}`, // Default name
              email: `${citizen_id}@temp.com`, // Temporary email
              verified: false
            }
          },
          { upsert: true, new: true }
        );
      } catch (citizenError) {
        console.warn('Could not update citizen record:', citizenError.message);
      }

      // Send response with complaint ID
      res.status(201).json({
        success: true,
        message: 'Complaint registered successfully',
        complaint_id: complaint.complaint_id,
        status: 'unresolved',
        created_at: complaint.created_at,
        category: finalCategory,
        dangerScore,
        duplicates: []
      });
    } catch (saveError) {
      console.error('Error saving complaint to database:', saveError);
      
      // Log detailed error information
      if (saveError.name === 'ValidationError') {
        const validationErrors = [];
        for (const field in saveError.errors) {
          validationErrors.push({
            field,
            message: saveError.errors[field].message,
            value: saveError.errors[field].value
          });
        }
        console.error('Validation errors:', validationErrors);
      }
      
      // Send detailed error response
      res.status(500).json({
        error: 'Failed to save complaint',
        details: process.env.NODE_ENV === 'development' ? saveError.message : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: saveError.stack })
      });
    }


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
