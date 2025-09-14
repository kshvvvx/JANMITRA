// JANMITRA backend bootstrap
// Sets up Express server with CORS, mounts routes, and starts the server

const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./config/database');
const { startComplaintAutoResolutionJob } = require('./utils/cronJobs');

// Import routes
const authRouter = require('./routes/auth');
const complaintsRouter = require('./routes/complaints');
const staffRouter = require('./routes/staff');
const departmentsRouter = require('./routes/departments');
const supervisorRouter = require('./routes/supervisor');
const auditLogsRouter = require('./routes/auditLogs');

// Import middleware
const auditLogMiddleware = require('./middleware/auditLogMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (should be before other middleware)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Audit logging middleware
app.use(auditLogMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
database.connect();

// Root endpoint
app.get('/', (req, res) => {
  res.send('JANMITRA backend is up');
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/supervisor', supervisorRouter);
app.use('/api/staff', staffRouter);
app.use('/api/audit-logs', auditLogsRouter);

// Error handling middleware (should be after all other middleware and routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler (should be the last route)
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  
  // Start cron jobs after server is running
  startComplaintAutoResolutionJob();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
