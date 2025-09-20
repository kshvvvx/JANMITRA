const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8001;

app.use(cors());
app.use(express.json());

// Mock danger score endpoint
app.post('/danger-score', (req, res) => {
  console.log('Received request to /danger-score:', req.body);
  
  // Simple mock response
  const response = {
    danger_score: 7.5,
    factors: ['location_risk', 'time_of_day'],
    confidence: 0.85
  };
  
  // Simulate some processing time
  setTimeout(() => {
    res.json(response);
  }, 500);
});

// Mock brief description endpoint
app.post('/brief-description', (req, res) => {
  console.log('Received request to /brief-description:', req.body);
  
  // Simple mock response
  const response = {
    description: 'Pothole on main road causing traffic issues',
    keywords: ['pothole', 'road', 'traffic']
  };
  
  // Simulate some processing time
  setTimeout(() => {
    res.json(response);
  }, 300);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mock-ai-service' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock AI Service running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- POST /danger-score`);
  console.log(`- POST /brief-description`);
  console.log(`- GET /health`);
});

module.exports = app;
