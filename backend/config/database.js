// MongoDB configuration for JANMITRA backend
// Supports both in-memory (development) and MongoDB (production) storage

const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra';
      
      this.client = new MongoClient(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      await this.client.connect();
      this.db = this.client.db('janmitra');
      this.isConnected = true;
      
      console.log('✅ Connected to MongoDB');
      
      // Create indexes for better performance
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('🔄 Falling back to in-memory storage');
      this.isConnected = false;
      return null;
    }
  }

  async createIndexes() {
    if (!this.db) return;

    try {
      // Create indexes for complaints collection
      await this.db.collection('complaints').createIndex({ complaint_id: 1 }, { unique: true });
      await this.db.collection('complaints').createIndex({ citizen_id: 1 });
      await this.db.collection('complaints').createIndex({ status: 1 });
      await this.db.collection('complaints').createIndex({ category: 1 });
      await this.db.collection('complaints').createIndex({ created_at: -1 });
      await this.db.collection('complaints').createIndex({ 'location.lat': 1, 'location.lng': 1 });

      // Create indexes for staff collection
      await this.db.collection('staff').createIndex({ staff_id: 1, dept: 1 }, { unique: true });

      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('📴 Disconnected from MongoDB');
    }
  }

  getCollection(name) {
    if (this.isConnected && this.db) {
      return this.db.collection(name);
    }
    return null;
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;
