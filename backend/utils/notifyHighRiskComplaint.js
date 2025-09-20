const { sendPushNotification } = require('./notifications');

async function notifyHighRiskComplaint(complaint, user) {
  try {
    const message = {
      title: '🚨 High Risk Complaint',
      body: `New ${complaint.ai_analysis.risk_level} risk complaint: ${complaint.description.substring(0, 50)}...`,
      data: {
        type: 'high_risk_alert',
        complaintId: complaint._id
      }
    };
    
    // Send to all supervisors
    await sendPushNotification('supervisors', message);
    
    console.log(`High risk notification sent for complaint ${complaint._id}`);
  } catch (error) {
    console.error('Error sending high risk notification:', error);
  }
}

module.exports = notifyHighRiskComplaint;