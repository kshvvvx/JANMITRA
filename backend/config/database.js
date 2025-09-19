// MongoDB configuration for JANMITRA backend using Mongoose
const mongoose = require('mongoose');
const logger = require('./logger');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra';
      
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully');
      
      return mongoose.connection;
    } catch (error) {
      logger.error(`MongoDB connection failed: ${error.message}`);
      logger.warn('Falling back to in-memory storage');
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;
