// Complaint management routes
// Handles CRUD operations for complaints with location filtering, upvoting, and refiling

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
      error: 'Internal server error'
    });
  }
});

// Get all complaints (with optional location filtering) - accessible to all authenticated users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { near } = req.query;
    let query = {};

    // If near parameter is provided, filter by location
    if (near) {
      // Parse coordinates from near parameter
      const coordinates = near.split(',');
      if (coordinates.length !== 2) {
        return res.status(400).json({
          error: 'Invalid near parameter format. Use: lat,lng (e.g., 28.7041,77.1025)'
        });
      }

      const searchLat = parseFloat(coordinates[0]);
      const searchLng = parseFloat(coordinates[1]);

      // Validate coordinates
      if (isNaN(searchLat) || isNaN(searchLng)) {
        return res.status(400).json({
          error: 'Invalid coordinates. Latitude and longitude must be valid numbers.'
        });
      }

      // Use MongoDB geospatial query for location filtering
      const radiusKm = 5;
      query = {
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
                          { $sin: { $multiply: [{ $degreesToRadians: searchLat }, 1] } },
                          { $sin: { $multiply: [{ $degreesToRadians: '$location.lat' }, 1] } }
                        ]
                      },
                      {
                        $multiply: [
                          { $cos: { $multiply: [{ $degreesToRadians: searchLat }, 1] } },
                          { $cos: { $multiply: [{ $degreesToRadians: '$location.lat' }, 1] } },
                          { $cos: { $multiply: [{ $degreesToRadians: { $subtract: ['$location.lng', searchLng] } }, 1] } }
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
      };
    }

    // Fetch complaints from MongoDB, sorted by created_at descending
    const complaints = await Complaint.find(query)
      .select('complaint_id description status location upvotes created_at')
      .sort({ created_at: -1 })
      .lean();

    // Return basic info only (id, description, status, location)
    const basicComplaints = complaints.map(complaint => ({
      id: complaint.complaint_id,
      description: complaint.description,
      status: complaint.status,
      location: complaint.location,
      upvotes: complaint.upvotes ? complaint.upvotes.length : 0,
      created_at: complaint.created_at
    }));

    res.json({
      count: basicComplaints.length,
      complaints: basicComplaints
    });

  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get nearby complaints sorted by distance
router.get('/nearby/:lat/:lng', authenticateToken, async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 10 } = req.query; // Default 10km radius
    
    const searchLat = parseFloat(lat);
    const searchLng = parseFloat(lng);
    
    // Validate coordinates
    if (isNaN(searchLat) || isNaN(searchLng)) {
      return res.status(400).json({
        error: 'Invalid coordinates. Latitude and longitude must be valid numbers.'
      });
    }
    
    if (searchLat < -90 || searchLat > 90 || searchLng < -180 || searchLng > 180) {
      return res.status(400).json({
        error: 'Invalid GPS coordinates: lat must be between -90 and 90, lng must be between -180 and 180'
      });
    }

    // Fetch all complaints with GPS coordinates
    const complaints = await Complaint.find({
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null }
    })
    .select('complaint_id description status location upvotes created_at')
    .lean();

    // Calculate distance for each complaint and filter by radius
    const nearbyComplaints = complaints
      .map(complaint => {
        const distance = calculateDistance(
          searchLat, 
          searchLng, 
          complaint.location.lat, 
          complaint.location.lng
        );
        
        return {
          id: complaint.complaint_id,
          description: complaint.description,
          status: complaint.status,
          location: complaint.location,
          upvotes: complaint.upvotes ? complaint.upvotes.length : 0,
          created_at: complaint.created_at,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      })
      .filter(complaint => complaint.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance); // Sort by distance ascending

    res.json({
      search_location: {
        lat: searchLat,
        lng: searchLng,
        radius: parseFloat(radius)
      },
      count: nearbyComplaints.length,
      complaints: nearbyComplaints
    });

  } catch (error) {
    console.error('Error fetching nearby complaints:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get a specific complaint by ID - accessible to all authenticated users
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find complaint by complaint_id in MongoDB
    const complaint = await Complaint.findOne({ complaint_id: id }).lean();
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    res.json(complaint);

  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update complaint status (staff and supervisors only)
router.put('/:id/status', requireStaffOrSupervisor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    // Use authenticated staff/supervisor ID
    const staff_id = req.user.userId;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        error: 'status is required'
      });
    }

    // Validate status values
    const validStatuses = ['unresolved', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: unresolved, in-progress, resolved'
      });
    }

    // Find and update complaint in MongoDB
    const complaint = await Complaint.findOne({ complaint_id: id });
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Update status using the schema method
    await complaint.updateStatus(status, 'staff', comment || `Status changed to ${status}`);

    res.json({
      complaint_id: id,
      status: complaint.status,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Upvote a complaint (citizens only)
router.post('/:id/upvote', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use authenticated citizen's ID
    const citizen_id = req.user.userId;

    // Find complaint by complaint_id in MongoDB
    const complaint = await Complaint.findOne({ complaint_id: id });
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Check if citizen already upvoted
    if (complaint.upvotes.includes(citizen_id)) {
      return res.status(400).json({
        error: 'Citizen has already upvoted this complaint'
      });
    }

    // Add upvote using schema method
    await complaint.addUpvote(citizen_id);

    // Send push notification to complaint owner about upvote
    try {
      const upvoteCount = complaint.upvotes.length;
      // Only notify on milestone upvotes to avoid spam
      if (upvoteCount === 1 || upvoteCount === 5 || upvoteCount === 10 || upvoteCount % 25 === 0) {
        await notifyComplaintUpvoted(
          id,
          complaint.citizen_id,
          upvoteCount
        );
      }
    } catch (error) {
      console.error('Failed to send upvote notification:', error);
    }

    // Update citizen's upvotes_given array
    try {
      await Citizen.findOneAndUpdate(
        { citizen_id },
        { $addToSet: { upvotes_given: id } },
        { upsert: true }
      );
    } catch (citizenError) {
      console.warn('Could not update citizen upvote record:', citizenError.message);
    }

    res.json({
      complaint_id: id,
      upvotes: complaint.upvotes.length
    });

  } catch (error) {
    console.error('Error upvoting complaint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Refile a complaint (citizens only)
router.post('/:id/refile', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, media } = req.body;
    
    // Use authenticated citizen's ID
    const citizen_id = req.user.userId;

    // Validate that new media is provided (required for refile)
    if (!media || !Array.isArray(media) || media.length === 0) {
      return res.status(400).json({
        error: 'New media (photo/video) is required when refiling a complaint'
      });
    }

    // Validate media format
    const validMedia = media.every(item => 
      item && typeof item === 'object' && 
      item.type && item.url &&
      ['image', 'video'].includes(item.type)
    );

    if (!validMedia) {
      return res.status(400).json({
        error: 'Invalid media format. Each media item must have type (image/video) and url'
      });
    }

    // Find complaint by complaint_id in MongoDB
    const complaint = await Complaint.findOne({ complaint_id: id });
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    const timestamp = new Date();

    // Use provided description or keep the original complaint description
    const updatedDescription = description || complaint.description;

    // Create refile entry
    const refileEntry = {
      citizen_id,
      description: updatedDescription,
      media: media,
      created_at: timestamp,
      // Location is locked - use original complaint location
      location: complaint.location
    };

    // Add refile to complaint
    complaint.refiles.push(refileEntry);

    // Update the main complaint description if new description was provided
    if (description && description.trim() !== '') {
      complaint.description = updatedDescription;
    }

    // Append new media to complaint actions log
    await complaint.addAction({
      actorType: 'citizen',
      action: 'media_added',
      comment: `Added ${media.length} new media file(s) during refile`,
      media: media
    });

    // Add refile action to history
    // Store old status for notification
    const oldStatus = complaint.status;

    // Update the complaint
    complaint.status = status;
    complaint.actions.push({
      action: 'status_updated',
      performed_by: req.user.userId,
      performed_at: new Date(),
      comment: comment || `Status changed to ${status}`
    });

    await complaint.save();

    // Send push notification to citizen about status change
    try {
      await notifyComplaintStatusChange(
        id,
        complaint.citizen_id,
        oldStatus,
        status,
        comment
      );
    } catch (error) {
      console.error('Failed to send status change notification:', error);
    }

    res.json({
      complaint_id: id,
      refiles: complaint.refiles.length,
      description: updatedDescription,
      location: complaint.location, // Return locked location
      new_media_count: media.length,
      message: 'Complaint successfully refiled with new media. Location remains locked.'
    });

  } catch (error) {
    console.error('Error refiling complaint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Confirm resolution of a complaint (citizens only)
router.post('/:id/confirm-resolution', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;
    const citizen_id = req.user.userId;

    // Find complaint by complaint_id in MongoDB
    const complaint = await Complaint.findOne({ complaint_id: id });
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Check if citizen already confirmed
    if (complaint.confirmations.includes(citizen_id)) {
      return res.status(400).json({
        error: 'You have already confirmed this resolution'
      });
    }

    // Use the model method to add confirmation and handle auto-resolution
    await complaint.addConfirmation(citizen_id);

    res.json({
      complaint_id: id,
      confirmations: complaint.confirmations.length,
      status: complaint.status,
      resolved: complaint.status === 'resolved',
      message: complaint.status === 'resolved' 
        ? 'Complaint automatically resolved after 3+ confirmations' 
        : 'Resolution confirmation recorded'
    });

  } catch (error) {
    console.error('Error confirming resolution:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Citizen voting endpoint - citizens vote "yes" or "refile" on resolved complaints
router.post('/:id/citizen-vote', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;
    const citizen_id = req.user.userId;

    if (!vote || !['yes', 'refile'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be either "yes" or "refile"' });
    }

    const complaint = await Complaint.findOne({ complaint_id: id });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.status !== 'awaiting_citizen_confirmation') {
      return res.status(400).json({ 
        error: 'Complaint is not awaiting citizen confirmation',
        current_status: complaint.status 
      });
    }

    await complaint.addCitizenVote(citizen_id, vote);

    const yesVotes = complaint.citizen_votes.filter(v => v.vote === 'yes').length;
    const refileVotes = complaint.citizen_votes.filter(v => v.vote === 'refile').length;

    res.json({
      complaint_id: id,
      vote_recorded: vote,
      yes_votes: yesVotes,
      refile_votes: refileVotes,
      status: complaint.status,
      resolved: complaint.status === 'resolved',
      message: complaint.status === 'resolved' 
        ? 'Complaint confirmed as resolved by citizens' 
        : vote === 'refile' 
          ? 'Complaint refiled - marked as unresolved'
          : 'Vote recorded - waiting for more citizen confirmations'
    });

  } catch (error) {
    console.error('Error recording citizen vote:', error);
    if (error.message.includes('already voted')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy confirm resolution endpoint (kept for backward compatibility)
router.post('/:id/confirm-resolution', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;
    const citizen_id = req.user.userId;

    const complaint = await Complaint.findOne({ complaint_id: id });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.confirmations.includes(citizen_id)) {
      return res.status(400).json({ error: 'You have already confirmed this resolution' });
    }

    await complaint.addConfirmation(citizen_id);

    res.json({
      complaint_id: id,
      confirmations: complaint.confirmations.length,
      status: complaint.status,
      resolved: complaint.status === 'resolved',
      message: 'Legacy confirmation recorded - please use /citizen-vote endpoint for new voting system'
    });

  } catch (error) {
    console.error('Error confirming resolution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual trigger for auto-resolution (for testing purposes)
router.post('/trigger-auto-resolution', async (req, res) => {
  try {
    const { triggerAutoResolution } = require('../utils/cronJobs');
    const result = await triggerAutoResolution();
    
    res.json({
      success: true,
      message: `Auto-resolved ${result.modifiedCount} complaints`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in manual auto-resolution trigger:', error);
    res.status(500).json({
      error: 'Failed to trigger auto-resolution'
    });
  }
});

module.exports = router;
