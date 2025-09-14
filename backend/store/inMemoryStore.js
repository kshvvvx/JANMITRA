// In-memory storage for complaints data
// Exports complaints array and complaint ID generation function

let complaints = [];
let complaintCounter = 1;

// Helper function to generate complaint ID
function generateComplaintId() {
  const paddedNumber = complaintCounter.toString().padStart(4, '0');
  const complaintId = `compl-${paddedNumber}`;
  complaintCounter++;
  return complaintId;
}

module.exports = {
  complaints,
  generateComplaintId
};
