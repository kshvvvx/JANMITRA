// MongoDB configuration for JANMITRA backend using Mongoose
const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra';
      
      await mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      console.log('✅ Connected to MongoDB with Mongoose');
      
      return mongoose.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('🔄 Falling back to in-memory storage');
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📴 Disconnected from MongoDB');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;
