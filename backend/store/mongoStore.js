// MongoDB-based storage for JANMITRA backend
// Provides the same interface as inMemoryStore but with MongoDB persistence

const database = require('../config/database');

class MongoStore {
  constructor() {
    this.complaints = [];
    this.complaintCounter = 1;
  }

  async initialize() {
    // Load existing complaints from MongoDB
    const collection = database.getCollection('complaints');
    if (collection) {
      try {
        const existingComplaints = await collection.find({}).toArray();
        this.complaints = existingComplaints;
        
        // Set counter to highest ID + 1
        if (existingComplaints.length > 0) {
          const maxId = Math.max(...existingComplaints.map(c => 
            parseInt(c.complaint_id.replace('compl-', ''))
          ));
          this.complaintCounter = maxId + 1;
        }
        
        console.log(`📊 Loaded ${existingComplaints.length} complaints from MongoDB`);
      } catch (error) {
        console.error('❌ Error loading complaints from MongoDB:', error);
        this.complaints = [];
      }
    }
  }

  generateComplaintId() {
    const paddedNumber = this.complaintCounter.toString().padStart(4, '0');
    const complaintId = `compl-${paddedNumber}`;
    this.complaintCounter++;
    return complaintId;
  }

  async addComplaint(complaint) {
    // Add to in-memory array
    this.complaints.push(complaint);

    // Persist to MongoDB
    const collection = database.getCollection('complaints');
    if (collection) {
      try {
        await collection.insertOne(complaint);
        console.log(`💾 Saved complaint ${complaint.complaint_id} to MongoDB`);
      } catch (error) {
        console.error('❌ Error saving complaint to MongoDB:', error);
      }
    }

    return complaint;
  }

  async updateComplaint(complaintId, updates) {
    // Update in-memory array
    const index = this.complaints.findIndex(c => c.complaint_id === complaintId);
    if (index !== -1) {
      this.complaints[index] = { ...this.complaints[index], ...updates };
    }

    // Update in MongoDB
    const collection = database.getCollection('complaints');
    if (collection) {
      try {
        await collection.updateOne(
          { complaint_id: complaintId },
          { $set: updates }
        );
        console.log(`💾 Updated complaint ${complaintId} in MongoDB`);
      } catch (error) {
        console.error('❌ Error updating complaint in MongoDB:', error);
      }
    }

    return this.complaints[index];
  }

  async getComplaints() {
    return this.complaints;
  }

  async getComplaintById(complaintId) {
    return this.complaints.find(c => c.complaint_id === complaintId);
  }

  async getComplaintsByCitizen(citizenId) {
    return this.complaints.filter(c => c.citizen_id === citizenId);
  }

  async getComplaintsByStatus(status) {
    return this.complaints.filter(c => c.status === status);
  }

  async getComplaintsNearby(lat, lng, radiusKm = 5) {
    // This would use MongoDB's geospatial queries in production
    // For now, we'll use the existing in-memory filtering
    return this.complaints.filter(complaint => {
      if (!complaint.location || !complaint.location.lat || !complaint.location.lng) {
        return false;
      }
      
      const distance = this.calculateDistance(
        lat, lng,
        complaint.location.lat, complaint.location.lng
      );
      
      return distance <= radiusKm;
    });
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }
}

// Export singleton instance
const mongoStore = new MongoStore();
module.exports = mongoStore;
