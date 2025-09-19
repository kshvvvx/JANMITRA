// Simplified cron jobs for automated complaint management

// Mock function for auto-resolving old complaints
function startComplaintAutoResolutionJob() {
  console.log('Cron jobs are disabled in development mode');
  // In production, this would be replaced with actual cron job logic
}

// Manual trigger for testing
function triggerAutoResolution() {
  console.log('Manual trigger for auto-resolution is disabled in development mode');
  return { success: true, message: 'Auto-resolution is disabled in development mode' };
}

module.exports = {
  startComplaintAutoResolutionJob,
  triggerAutoResolution
};
