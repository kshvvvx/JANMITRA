// Push notification utilities for JANMITRA backend
// Handles sending push notifications via Expo Push API

const { Expo } = require('expo-server-sdk');
const PushToken = require('../models/PushToken');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to specific users
 * @param {Array} userIds - Array of user IDs to send notifications to
 * @param {string} userType - Type of users ('citizen', 'staff', 'supervisor')
 * @param {Object} notification - Notification content
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Additional data to send with notification
 */
async function sendPushNotification(userIds, userType, notification) {
  try {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    // Get active push tokens for the users
    const pushTokens = await PushToken.find({
      userId: { $in: userIds },
      userType,
      isActive: true
    });

    if (pushTokens.length === 0) {
      console.log(`No active push tokens found for users: ${userIds.join(', ')}`);
      return { success: true, sent: 0 };
    }

    // Prepare messages
    const messages = [];
    for (const tokenRecord of pushTokens) {
      // Check that all push tokens are valid Expo push tokens
      if (!Expo.isExpoPushToken(tokenRecord.token)) {
        console.error(`Push token ${tokenRecord.token} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: tokenRecord.token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      });
    }

    if (messages.length === 0) {
      console.log('No valid push tokens to send notifications to');
      return { success: true, sent: 0 };
    }

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Update last used timestamp for successful tokens
    await PushToken.updateMany(
      { 
        userId: { $in: userIds },
        userType,
        isActive: true
      },
      { lastUsed: new Date() }
    );

    console.log(`Sent ${messages.length} push notifications to ${userType} users: ${userIds.join(', ')}`);
    return { success: true, sent: messages.length, tickets };

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification when complaint status changes
 * @param {string} complaintId - ID of the complaint
 * @param {string} citizenId - ID of the citizen who filed the complaint
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string} comment - Optional comment from staff
 */
async function notifyComplaintStatusChange(complaintId, citizenId, oldStatus, newStatus, comment = '') {
  const statusMessages = {
    'in-progress': {
      title: 'Complaint Update',
      body: 'Your complaint is now being reviewed by our team.'
    },
    'resolved': {
      title: 'Complaint Resolved',
      body: 'Great news! Your complaint has been resolved.'
    },
    'rejected': {
      title: 'Complaint Update',
      body: 'Your complaint has been reviewed. Please check the details.'
    }
  };

  const notification = statusMessages[newStatus] || {
    title: 'Complaint Update',
    body: `Your complaint status has been updated to: ${newStatus}`
  };

  // Add comment to body if provided
  if (comment) {
    notification.body += ` Comment: ${comment}`;
  }

  // Add complaint data
  notification.data = {
    type: 'complaint_status_change',
    complaintId,
    oldStatus,
    newStatus,
    comment
  };

  return await sendPushNotification([citizenId], 'citizen', notification);
}

/**
 * Send notification when complaint receives upvotes
 * @param {string} complaintId - ID of the complaint
 * @param {string} citizenId - ID of the citizen who filed the complaint
 * @param {number} upvoteCount - Current upvote count
 */
async function notifyComplaintUpvoted(complaintId, citizenId, upvoteCount) {
  const notification = {
    title: 'Your Complaint Got Support!',
    body: `Your complaint now has ${upvoteCount} upvote${upvoteCount !== 1 ? 's' : ''} from the community.`,
    data: {
      type: 'complaint_upvoted',
      complaintId,
      upvoteCount
    }
  };

  return await sendPushNotification([citizenId], 'citizen', notification);
}

/**
 * Send notification to staff when new complaint is filed
 * @param {string} complaintId - ID of the new complaint
 * @param {string} description - Complaint description
 * @param {string} location - Complaint location
 */
async function notifyStaffNewComplaint(complaintId, description, location) {
  // Get all active staff members
  const Staff = require('../models/Staff');
  const staffMembers = await Staff.find({ status: 'active' });
  const staffIds = staffMembers.map(staff => staff.staff_id);

  if (staffIds.length === 0) {
    console.log('No active staff members to notify');
    return { success: true, sent: 0 };
  }

  const notification = {
    title: 'New Complaint Filed',
    body: `New complaint at ${location}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
    data: {
      type: 'new_complaint',
      complaintId,
      location
    }
  };

  return await sendPushNotification(staffIds, 'staff', notification);
}

/**
 * Clean up invalid push tokens
 * This should be run periodically to remove tokens that are no longer valid
 */
async function cleanupInvalidTokens() {
  try {
    // This would typically be called after processing push notification receipts
    // For now, we'll just clean up old inactive tokens
    const result = await PushToken.cleanupOldTokens(30); // Remove tokens older than 30 days
    console.log(`Cleaned up ${result.deletedCount} old push tokens`);
    return result;
  } catch (error) {
    console.error('Error cleaning up push tokens:', error);
    return { deletedCount: 0 };
  }
}

module.exports = {
  sendPushNotification,
  notifyComplaintStatusChange,
  notifyComplaintUpvoted,
  notifyStaffNewComplaint,
  cleanupInvalidTokens
};
