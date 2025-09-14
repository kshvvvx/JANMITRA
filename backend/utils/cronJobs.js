// Cron jobs for automated complaint management
// Handles daily auto-resolution of old awaiting_confirmation complaints

const cron = require('node-cron');
const { Complaint } = require('../models');

// Daily cron job to auto-resolve old awaiting_confirmation complaints
function startComplaintAutoResolutionJob() {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Running daily auto-resolution job for old complaints...');
      
      const result = await Complaint.autoResolveOldComplaints();
      
      if (result.modifiedCount > 0) {
        console.log(`Auto-resolved ${result.modifiedCount} complaints that were in awaiting_confirmation status for >7 days`);
      } else {
        console.log('No old awaiting_confirmation complaints found to auto-resolve');
      }
    } catch (error) {
      console.error('Error in auto-resolution cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });
  
  console.log('Daily complaint auto-resolution cron job started (runs at 2:00 AM IST)');
}

// Manual trigger for testing purposes
async function triggerAutoResolution() {
  try {
    console.log('Manually triggering auto-resolution...');
    const result = await Complaint.autoResolveOldComplaints();
    
    console.log(`Auto-resolved ${result.modifiedCount} complaints`);
    return result;
  } catch (error) {
    console.error('Error in manual auto-resolution:', error);
    throw error;
  }
}

module.exports = {
  startComplaintAutoResolutionJob,
  triggerAutoResolution
};
