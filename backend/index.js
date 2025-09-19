require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const { 
  generalLimiter, 
  authLimiter, 
  complaintLimiter, 
  supervisorLimiter,
  redisClient
} = require('./middleware/rateLimiter');
const xss = require('xss-clean');
const path = require('path');
const http = require('http');
const net = require('net');
const { StatusCodes } = require('http-status-codes');
const logger = require('./config/logger');

// Server instance will be set when the server starts
let server = null;

/**
 * Normalize a port into a number, string, or false.
 * @param {string|number} val - The port value to normalize
 * @returns {number|string|boolean} - The normalized port value
 */
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val; // named pipe
  if (port >= 0) return port; // port number
  return false;
};

/**
 * Check if a port is available
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        server.close();
        resolve(false);
      })
      .once('listening', () => {
        server.close();
        resolve(true);
      })
      .listen(port);
  });
};

/**
 * Find the next available port starting from the specified port
 * @param {number} port - The starting port number
 * @param {number} [maxAttempts=10] - Maximum number of ports to try
 * @returns {Promise<number>} - The first available port number
 */
const findAvailablePort = async (port, maxAttempts = 10) => {
  let currentPort = port;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const isAvailable = await isPortAvailable(currentPort);
    if (isAvailable) {
      return currentPort;
    }
    
    if (currentPort !== port) {
      logger.warn(`Port ${currentPort - 1} is in use, trying ${currentPort}...`);
    }
    
    currentPort++;
    attempts++;
  }
  
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
};

// Import routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const supervisorRoutes = require('./routes/supervisor');
const auditLogRoutes = require('./routes/auditLogs');
const { startComplaintAutoResolutionJob } = require('./utils/cronJobs');

// Initialize express app
const app = express();

// ======================
// Security Middleware
// ======================

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Configure this in production
  credentials: true
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Apply rate limiting
app.use(generalLimiter); // Global rate limiter

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// Database Connection
// ======================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => logger.info('✅ Connected to MongoDB'))
.catch(err => {
  logger.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ======================
// Routes
// ======================

// Apply auth rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Apply complaint rate limiting to complaint submission routes
app.post('/api/complaints', complaintLimiter);
app.post('/api/complaints/:id/refile', complaintLimiter);

// Apply supervisor rate limiting to escalation route
app.post('/api/complaints/:id/escalate', supervisorLimiter);

// Health check endpoint (excluded from rate limiting)
app.get('/', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'JANMITRA API is running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Alias for /api/health to maintain backward compatibility
app.get('/api/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/supervisor', supervisorRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// 404 Handler
app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : 'Something went wrong!'
    });
  }
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT;

const startServer = async () => {
  try {
    logger.info('Starting server...');
    
    // Wait for MongoDB connection with timeout
    await new Promise((resolve, reject) => {
      const db = require('./config/database');
      
      // Connect to MongoDB
      db.connect()
        .then(() => resolve())
        .catch(err => reject(err));
      
      // Set connection timeout
      setTimeout(() => {
        reject(new Error('MongoDB connection timeout'));
      }, 10000); // 10 seconds timeout
    });
    
    // Get port from environment and normalize
    const basePort = normalizePort(process.env.PORT || '5000');
    
    // Create HTTP server
    server = http.createServer(app);
    
    // Function to start server on a specific port
    const startServerOnPort = async (port) => {
      return new Promise((resolve, reject) => {
        const onError = (error) => {
          if (error.syscall !== 'listen') {
            return reject(error);
          }
          
          // Handle specific listen errors
          switch (error.code) {
            case 'EACCES':
              logger.error(`Port ${port} requires elevated privileges`);
              return reject(new Error(`Port ${port} requires elevated privileges`));
            case 'EADDRINUSE':
              logger.warn(`Port ${port} is already in use, trying next port...`);
              return startServerOnPort(port + 1).then(resolve).catch(reject);
            default:
              return reject(error);
          }
        };
        
        server.once('error', onError);
        
        server.listen(port, () => {
          // Remove error listener since we're now listening
          server.removeListener('error', onError);
          
          const addr = server.address();
          const bind = typeof addr === 'string' 
            ? `pipe ${addr}` 
            : `port ${addr.port}`;
            
          logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on ${bind}`);
          logger.info(`Access the server at: http://localhost:${addr.port || addr}`);
          
          resolve(server);
        });
      });
    };
    
    // Start the server
    await startServerOnPort(basePort);
    
    // Start cron jobs if in production
    if (process.env.NODE_ENV === 'production') {
      const { startComplaintAutoResolutionJob } = require('./utils/cronJobs');
      startComplaintAutoResolutionJob();
    }
    
    return server;
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  // Close the Redis client if it exists
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    } catch (err) {
      logger.error('Error closing Redis client:', err);
    }
  }
  
  // Close the server
  if (server) {
    server.close(() => {
      logger.info('💥 Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  gracefulShutdown();
});

// Handle termination signals
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    logger.info(`👋 ${signal} RECEIVED. Shutting down gracefully`);
    gracefulShutdown();
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Error name:', err.name);
  logger.error('Error message:', err.message);
  logger.error('Error stack:', err.stack);
  
  // Close server if it exists
  if (server) {
    server.close(() => {
      logger.error('Server closed due to uncaught exception');
      process.exit(1);
    });
    
    // Force exit after timeout if server doesn't close
    setTimeout(() => {
      logger.error('Forcing process exit after uncaught exception');
      process.exit(1);
    }, 1000);
  } else {
    process.exit(1);
  }
});

// Start the application
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server, startServer };
