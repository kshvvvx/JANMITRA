// Complaint management routes
// Handles CRUD operations for complaints with location filtering, upvoting, and refiling

const express = require('express');
const router = express.Router();
const { Complaint, Citizen } = require('../models');
const { calculateDistance } = require('../utils/geo');
const { authenticateToken, requireCitizen, requireStaff, requireSupervisor, requireStaffOrSupervisor } = require('../middleware/auth');

// Create a new complaint (citizens only)
router.post('/', requireCitizen, async (req, res) => {
  try {
    const { description, category, location, media } = req.body;
    
    // Use authenticated citizen's ID
    const citizen_id = req.user.userId;

    // Basic validation
    if (!description || !location) {
      return res.status(400).json({
        error: 'Missing required fields: description and location are required'
      });
    }

    // Generate complaint ID
    const complaint_id = Complaint.generateComplaintId();

    // AI Analysis (if AI service is available)
    let aiAnalysis = null;
    let finalCategory = category || 'other';
    let dangerScore = 0;
    let duplicates = [];

    try {
      // Get existing complaints for AI analysis
      const existingComplaints = await Complaint.find({}, 'complaint_id description').lean();
      
      // Call AI service for analysis
      const aiResponse = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          existing_complaints: existingComplaints
        })
      });

      if (aiResponse.ok) {
        aiAnalysis = await aiResponse.json();
        finalCategory = aiAnalysis.category;
        dangerScore = aiAnalysis.danger_score;
        duplicates = aiAnalysis.duplicates;
        
        console.log(`AI Analysis for ${complaint_id}:`, {
          category: finalCategory,
          dangerScore,
          duplicates: duplicates.length
        });
      }
    } catch (aiError) {
      console.warn('AI service unavailable, using fallback categorization:', aiError.message);
    }

    // Create complaint in MongoDB
    const complaint = new Complaint({
      complaint_id,
      citizen_id,
      description,
      location,
      media: media || [],
      status: 'unresolved',
      upvotes: [],
      refiles: [],
      actions: [],
      confirmations: [],
      dangerScore
    });

    const savedComplaint = await complaint.save();

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

    // Return response
    res.status(201).json({
      complaint_id,
      status: 'unresolved',
      created_at: savedComplaint.created_at,
      category: finalCategory,
      dangerScore,
      duplicates: duplicates.length > 0 ? duplicates.slice(0, 3) : [] // Return top 3 duplicates
    });

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
    await complaint.addAction({
      actorType: 'citizen',
      action: 'complaint_refiled',
      comment: description ? 'Complaint refiled with updated description and new media' : 'Complaint refiled with new media'
    });

    await complaint.save();

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
router.post('/:id/confirm_resolution', requireCitizen, async (req, res) => {
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

    // Check if citizen already confirmed
    if (complaint.confirmations.includes(citizen_id)) {
      return res.status(400).json({
        error: 'Already confirmed'
      });
    }

    // Add citizen_id to confirmations
    complaint.confirmations.push(citizen_id);

    // Check if we have enough confirmations or if 7 days have passed
    const shouldClose = complaint.confirmations.length >= 3 || 
      (complaint.resolved_at && 
       (new Date() - new Date(complaint.resolved_at)) >= (7 * 24 * 60 * 60 * 1000));

    if (shouldClose) {
      complaint.status = 'closed';
      complaint.closed_at = new Date();
      
      // Add confirmation action
      await complaint.addAction({
        actorType: 'citizen',
        action: 'confirm_resolution',
        comment: `Complaint closed with ${complaint.confirmations.length} confirmations`
      });
    }

    await complaint.save();

    res.json({
      complaint_id: id,
      confirmations: complaint.confirmations.length,
      status: complaint.status,
      message: shouldClose ? 'Complaint closed due to confirmations' : 'Confirmation recorded'
    });

  } catch (error) {
    console.error('Error confirming resolution:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
