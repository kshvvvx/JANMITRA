// Complaint management routes
// Handles CRUD operations for complaints with location filtering, upvoting, and refiling

const express = require('express');
const router = express.Router();
const { complaints, generateComplaintId } = require('../store/inMemoryStore');
const { calculateDistance } = require('../utils/geo');

// Create a new complaint
router.post('/', async (req, res) => {
  try {
    const { citizen_id, description, category, location, media } = req.body;

    // Basic validation
    if (!citizen_id || !description || !location) {
      return res.status(400).json({
        error: 'Missing required fields: citizen_id, description, and location are required'
      });
    }

    // Generate complaint ID and timestamp
    const complaint_id = generateComplaintId();
    const created_at = new Date().toISOString();

    // AI Analysis (if AI service is available)
    let aiAnalysis = null;
    let finalCategory = category || 'other';
    let dangerScore = 0;
    let duplicates = [];

    try {
      // Call AI service for analysis
      const aiResponse = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          existing_complaints: complaints.map(c => ({
            complaint_id: c.complaint_id,
            description: c.description
          }))
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

    // Create complaint object
    const complaint = {
      complaint_id,
      citizen_id,
      description,
      category: finalCategory,
      location,
      media: media || [],
      status: 'unresolved',
      created_at,
      upvotes: [],
      refiles: [],
      actions: [],
      confirmations: [],
      dangerScore,
      aiAnalysis: aiAnalysis ? {
        confidence: aiAnalysis.confidence,
        urgency_level: aiAnalysis.urgency_level,
        duplicate_count: aiAnalysis.duplicate_count
      } : null
    };

    // Store in memory
    complaints.push(complaint);

    // Return response
    res.status(201).json({
      complaint_id,
      status: 'unresolved',
      created_at,
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

// Get all complaints (with optional location filtering)
router.get('/', (req, res) => {
  try {
    const { near } = req.query;
    let filteredComplaints = [...complaints];

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

      // Filter complaints within 5km radius
      const radiusKm = 5;
      filteredComplaints = complaints.filter(complaint => {
        if (!complaint.location || !complaint.location.lat || !complaint.location.lng) {
          return false; // Skip complaints without valid location
        }
        
        const distance = calculateDistance(
          searchLat, searchLng,
          complaint.location.lat, complaint.location.lng
        );
        
        return distance <= radiusKm;
      });
    }

    // Sort complaints by created_at in descending order (newest first)
    const sortedComplaints = filteredComplaints.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    // Return basic info only (id, description, status, location)
    const basicComplaints = sortedComplaints.map(complaint => ({
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

// Get a specific complaint by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Find complaint by complaint_id
    const complaint = complaints.find(c => c.complaint_id === id);
    
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

// Update complaint status (staff only)
router.put('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, staff_id } = req.body;

    // Validate required fields
    if (!status || !staff_id) {
      return res.status(400).json({
        error: 'status and staff_id are required'
      });
    }

    // Validate status values
    const validStatuses = ['unresolved', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: unresolved, in-progress, resolved'
      });
    }

    // Find complaint by complaint_id
    const complaint = complaints.find(c => c.complaint_id === id);
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Update complaint status
    const previousStatus = complaint.status;
    complaint.status = status;

    // Initialize actions array if it doesn't exist
    if (!complaint.actions) {
      complaint.actions = [];
    }

    // Add status update action to history
    const action = {
      actorType: 'staff',
      staff_id,
      action: 'status_update',
      previousStatus,
      newStatus: status,
      comment: comment || null,
      timestamp: new Date().toISOString()
    };
    complaint.actions.push(action);

    // Set resolved_at timestamp if status is resolved
    if (status === 'resolved' && previousStatus !== 'resolved') {
      complaint.resolved_at = new Date().toISOString();
    }

    res.json({
      complaint_id: id,
      status: complaint.status,
      updated_at: action.timestamp,
      message: `Complaint status updated from ${previousStatus} to ${status}`
    });

  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Upvote a complaint
router.post('/:id/upvote', (req, res) => {
  try {
    const { id } = req.params;
    const { citizen_id } = req.body;

    // Validate citizen_id
    if (!citizen_id) {
      return res.status(400).json({
        error: 'citizen_id is required'
      });
    }

    // Find complaint by complaint_id
    const complaint = complaints.find(c => c.complaint_id === id);
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Initialize upvotes array if it doesn't exist
    if (!complaint.upvotes) {
      complaint.upvotes = [];
    }

    // Check if citizen already upvoted
    if (complaint.upvotes.includes(citizen_id)) {
      return res.status(400).json({
        error: 'Citizen has already upvoted this complaint'
      });
    }

    // Add upvote
    complaint.upvotes.push(citizen_id);

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

// Refile a complaint
router.post('/:id/refile', (req, res) => {
  try {
    const { id } = req.params;
    const { citizen_id, description, media } = req.body;

    // Validate required fields
    if (!citizen_id || !description) {
      return res.status(400).json({
        error: 'citizen_id and description are required'
      });
    }

    // Find complaint by complaint_id
    const complaint = complaints.find(c => c.complaint_id === id);
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Initialize refiles array if it doesn't exist
    if (!complaint.refiles) {
      complaint.refiles = [];
    }

    // Create refile entry
    const refileEntry = {
      citizen_id,
      description,
      media: media || [],
      created_at: new Date().toISOString()
    };

    // Add refile to complaint
    complaint.refiles.push(refileEntry);

    res.json({
      complaint_id: id,
      refiles: complaint.refiles.length
    });

  } catch (error) {
    console.error('Error refiling complaint:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Confirm resolution of a complaint
router.post('/:id/confirm_resolution', (req, res) => {
  try {
    const { id } = req.params;
    const { citizen_id } = req.body;

    // Validate citizen_id
    if (!citizen_id) {
      return res.status(400).json({
        error: 'citizen_id is required'
      });
    }

    // Find complaint by complaint_id
    const complaint = complaints.find(c => c.complaint_id === id);
    
    if (!complaint) {
      return res.status(404).json({
        error: 'Complaint not found'
      });
    }

    // Initialize confirmations array if it doesn't exist
    complaint.confirmations = complaint.confirmations || [];

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
      complaint.closed_at = new Date().toISOString();
      
      // Ensure actions array exists
      if (!complaint.actions) {
        complaint.actions = [];
      }
      
      // Add confirmation action
      const action = {
        actorType: 'citizen',
        citizen_id,
        action: 'confirm_resolution',
        timestamp: new Date().toISOString()
      };
      complaint.actions.push(action);
    }

    res.json({
      success: true,
      confirmations: complaint.confirmations.length,
      status: complaint.status
    });

  } catch (error) {
    console.error('Error confirming resolution:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;
