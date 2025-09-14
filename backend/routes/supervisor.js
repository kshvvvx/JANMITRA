const express = require('express');
const router = express.Router();
const SupervisorChat = require('../models/SupervisorChat');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { requireSupervisor } = require('../middleware/auth');

// Get all chats for a supervisor
router.get('/chats', requireSupervisor, async (req, res) => {
  try {
    const supervisor_id = req.user.userId;
    
    const chats = await SupervisorChat.getUserChats(supervisor_id, 'supervisor');
    
    // Add unread counts to each chat
    const chatsWithUnread = chats.map(chat => ({
      ...chat,
      unread_count: chat.messages ? chat.messages.filter(msg => 
        msg.sender_id !== supervisor_id && 
        !msg.read_by.some(r => r.user_id === supervisor_id)
      ).length : 0,
      last_message: chat.messages && chat.messages.length > 0 
        ? chat.messages[chat.messages.length - 1] 
        : null
    }));

    res.json({
      chats: chatsWithUnread,
      total_chats: chatsWithUnread.length
    });

  } catch (error) {
    console.error('Error fetching supervisor chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get or create chat with a department
router.post('/chats/:department_id', requireSupervisor, async (req, res) => {
  try {
    const { department_id } = req.params;
    const supervisor_id = req.user.userId;

    // Check if department exists
    const department = await Department.findOne({ unique_id: department_id });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Find existing chat or create new one
    let chat = await SupervisorChat.findChatBetween(supervisor_id, department_id);
    
    if (!chat) {
      chat = await SupervisorChat.createChat(
        supervisor_id, 
        department_id, 
        `Chat with ${department.name}`
      );
    }

    res.json({
      chat_id: chat.chat_id,
      department_name: department.name,
      messages: chat.getRecentMessages(50),
      unread_count: chat.getUnreadCount(supervisor_id)
    });

  } catch (error) {
    console.error('Error creating/fetching chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message in chat
router.post('/chats/:chat_id/messages', requireSupervisor, async (req, res) => {
  try {
    const { chat_id } = req.params;
    const { message, message_type = 'text', complaint_id } = req.body;
    const supervisor_id = req.user.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const chat = await SupervisorChat.findOne({ chat_id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Verify supervisor has access to this chat
    if (chat.supervisor_id !== supervisor_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await chat.addMessage(supervisor_id, 'supervisor', message, message_type, complaint_id);

    // Log the message
    await AuditLog.logAction({
      userId: supervisor_id,
      userType: 'supervisor',
      action: 'chat_message_sent',
      resourceType: 'chat',
      resourceId: chat_id,
      details: {
        message_type: message_type,
        complaint_id: complaint_id,
        department_id: chat.department_id
      }
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
      chat_id: chat_id
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark complaint as urgent
router.post('/complaints/:id/mark-urgent', requireSupervisor, async (req, res) => {
  try {
    const { id } = req.params;
    const { urgency_level = 'high', reason } = req.body;
    const supervisor_id = req.user.userId;

    const complaint = await Complaint.findOne({ complaint_id: id });
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Update complaint with urgency marking
    complaint.dangerScore = Math.max(complaint.dangerScore, urgency_level === 'critical' ? 10 : 8);
    
    complaint.actions.push({
      type: 'marked_urgent',
      performed_by: supervisor_id,
      details: {
        urgency_level: urgency_level,
        reason: reason,
        previous_danger_score: complaint.dangerScore
      }
    });

    await complaint.save();

    // Send urgent alert to department
    const department = await Department.findOne({ 
      category: complaint.category || 'general',
      state: complaint.location.state,
      city: complaint.location.city
    });

    if (department) {
      const alertMessage = `🚨 URGENT: Complaint ${id} marked as ${urgency_level} priority. Reason: ${reason || 'Supervisor escalation'}`;
      
      await SupervisorChat.sendUrgentAlert(
        supervisor_id,
        department.unique_id,
        id,
        alertMessage
      );
    }

    // Log the action
    await AuditLog.logAction({
      userId: supervisor_id,
      userType: 'supervisor',
      action: 'complaint_marked_urgent',
      resourceType: 'complaint',
      resourceId: id,
      details: {
        urgency_level: urgency_level,
        reason: reason,
        department_notified: department ? department.unique_id : null
      }
    });

    res.json({
      success: true,
      message: 'Complaint marked as urgent',
      complaint_id: id,
      urgency_level: urgency_level,
      department_notified: department ? department.name : null
    });

  } catch (error) {
    console.error('Error marking complaint as urgent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supervisor dashboard data
router.get('/dashboard', requireSupervisor, async (req, res) => {
  try {
    const supervisor_id = req.user.userId;

    // Get departments under this supervisor
    const departments = await Department.find({ supervisor_id: supervisor_id, active: true });
    
    // Get recent complaints for these departments
    const departmentCategories = departments.map(d => d.category);
    const recentComplaints = await Complaint.find({
      category: { $in: departmentCategories },
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ created_at: -1 }).limit(20);

    // Get urgent complaints (high danger score)
    const urgentComplaints = await Complaint.find({
      category: { $in: departmentCategories },
      dangerScore: { $gte: 7 },
      status: { $in: ['unresolved', 'in-progress'] }
    }).sort({ dangerScore: -1, created_at: -1 }).limit(10);

    // Get unread chat messages
    const chats = await SupervisorChat.getUserChats(supervisor_id, 'supervisor');
    const totalUnreadMessages = chats.reduce((total, chat) => {
      return total + (chat.messages ? chat.messages.filter(msg => 
        msg.sender_id !== supervisor_id && 
        !msg.read_by.some(r => r.user_id === supervisor_id)
      ).length : 0);
    }, 0);

    // Calculate department performance metrics
    const departmentStats = departments.map(dept => ({
      id: dept.unique_id,
      name: dept.name,
      category: dept.category,
      location: `${dept.city}, ${dept.state}`,
      metrics: dept.performance_metrics,
      active_devices: dept.logged_in_devices.length,
      banned_numbers: dept.banned_numbers.length
    }));

    res.json({
      supervisor_id: supervisor_id,
      departments: departmentStats,
      recent_complaints: recentComplaints,
      urgent_complaints: urgentComplaints,
      unread_messages: totalUnreadMessages,
      active_chats: chats.length,
      summary: {
        total_departments: departments.length,
        total_recent_complaints: recentComplaints.length,
        urgent_complaints_count: urgentComplaints.length,
        avg_department_efficiency: departments.reduce((sum, d) => 
          sum + d.performance_metrics.efficiency_score, 0) / departments.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching supervisor dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark messages as read
router.post('/chats/:chat_id/mark-read', requireSupervisor, async (req, res) => {
  try {
    const { chat_id } = req.params;
    const { message_ids } = req.body;
    const supervisor_id = req.user.userId;

    const chat = await SupervisorChat.findOne({ chat_id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.supervisor_id !== supervisor_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark specified messages as read
    if (message_ids && Array.isArray(message_ids)) {
      for (const messageId of message_ids) {
        await chat.markMessageAsRead(messageId, supervisor_id);
      }
    } else {
      // Mark all unread messages as read
      chat.messages.forEach(message => {
        if (message.sender_id !== supervisor_id) {
          const hasRead = message.read_by.some(r => r.user_id === supervisor_id);
          if (!hasRead) {
            message.read_by.push({
              user_id: supervisor_id,
              read_at: new Date()
            });
          }
        }
      });
      await chat.save();
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
