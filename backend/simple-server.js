// Simplified JANMITRA server for debugging
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Test endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'JANMITRA backend server',
    status: 'running',
    endpoints: {
      complaints: '/api/complaints',
      auth: '/api/auth',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Simple test complaint endpoint
app.get('/api/complaints', (req, res) => {
  res.json({
    success: true,
    complaints: [],
    message: 'Complaints API endpoint working'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ JANMITRA backend server running on http://localhost:${PORT}`);
  console.log('📊 Health check: http://localhost:3000/health');
  console.log('📋 API endpoint: http://localhost:3000/api/complaints');
});
