// backend/routes/staff.js - Staff auth & dashboard routes
const express = require('express');
const router = express.Router();
const { complaints } = require('../store/inMemoryStore');
const { findStaff } = require('../store/staffStore');
const { generateStaffToken, requireStaff } = require('../utils/auth');

// POST /login
router.post('/login', (req, res) => {
  const { dept, staff_id } = req.body;
  
  const staff = findStaff(dept, staff_id);
  if (!staff) {
    return res.status(401).json({ error: 'Invalid dept or staff_id' });
  }
  
  const token = generateStaffToken(staff);
  res.json({ success: true, token, staff });
});

// GET /complaints
router.get('/complaints', requireStaff, (req, res) => {
  const { sort = 'priority', ward, status, page = 1, limit = 50 } = req.query;
  
  let filteredComplaints = [...complaints];
  
  // Apply filters
  if (ward) {
    filteredComplaints = filteredComplaints.filter(c => c.ward === parseInt(ward));
  }
  if (status) {
    filteredComplaints = filteredComplaints.filter(c => c.status === status);
  }
  
  // Apply sorting
  if (sort === 'priority') {
    filteredComplaints.sort((a, b) => {
      // Primary: dangerScore desc (treat missing as 0)
      const aDanger = a.dangerScore || 0;
      const bDanger = b.dangerScore || 0;
      if (aDanger !== bDanger) return bDanger - aDanger;
      
      // Secondary: upvotes.length desc
      const aUpvotes = a.upvotes ? a.upvotes.length : 0;
      const bUpvotes = b.upvotes ? b.upvotes.length : 0;
      if (aUpvotes !== bUpvotes) return bUpvotes - aUpvotes;
      
      // Tertiary: created_at ascending (older first)
      return new Date(a.created_at) - new Date(b.created_at);
    });
  } else if (sort === 'new') {
    filteredComplaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sort === 'old') {
    filteredComplaints.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);
  
  res.json({ count: filteredComplaints.length, complaints: paginatedComplaints });
});

// POST /complaints/:id/update
router.post('/complaints/:id/update', requireStaff, (req, res) => {
  const { id } = req.params;
  const { status, comment, media, expected_resolution_date } = req.body;
  
  const complaint = complaints.find(c => c.complaint_id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  
  // Ensure actions array exists
  if (!complaint.actions) {
    complaint.actions = [];
  }
  
  // Add action
  const action = {
    actorType: 'staff',
    staff_id: req.staff.staff_id,
    dept: req.staff.dept,
    action: 'update_status',
    details: { status, comment, expected_resolution_date, media },
    timestamp: new Date().toISOString()
  };
  complaint.actions.push(action);
  
  // Handle status update
  if (status === 'resolved' || status === 'resolve') {
    complaint.status = 'awaiting_confirmation';
    complaint.resolved_by = req.staff.staff_id;
    complaint.resolved_at = new Date().toISOString();
    complaint.resolution_media = media || [];
    complaint.expected_resolution_date = expected_resolution_date || null;
  } else {
    complaint.status = status;
  }
  
  res.json({ success: true, complaint });
});

// GET /complaints/history
router.get('/complaints/history', requireStaff, (req, res) => {
  const { from, to, ward, urgencyMin } = req.query;
  
  let filteredComplaints = complaints.filter(c => c.status === 'closed');
  
  // Apply filters
  if (ward) {
    filteredComplaints = filteredComplaints.filter(c => c.ward === parseInt(ward));
  }
  
  if (urgencyMin) {
    filteredComplaints = filteredComplaints.filter(c => (c.urgency || 0) >= parseInt(urgencyMin));
  }
  
  // Date filtering
  if (from || to) {
    filteredComplaints = filteredComplaints.filter(c => {
      const dateToCheck = c.closed_at || c.resolved_at;
      if (!dateToCheck) return false;
      
      const complaintDate = new Date(dateToCheck);
      
      if (from && complaintDate < new Date(from)) return false;
      if (to && complaintDate > new Date(to)) return false;
      
      return true;
    });
  }
  
  res.json({ count: filteredComplaints.length, complaints: filteredComplaints });
});

module.exports = router;
