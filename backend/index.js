// JANMITRA backend bootstrap
// Sets up Express server with CORS, mounts complaint routes, and starts the server

const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./config/database');
const complaintsRouter = require('./routes/complaints');
const staffRouter = require('./routes/staff');
const authRouter = require('./routes/auth-simple');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
database.connect();

// Root endpoint
app.get('/', (req, res) => {
  res.send('JANMITRA backend is up');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Mount auth router
console.log('Mounting auth router...');
app.use('/api/auth', authRouter);
console.log('Auth router mounted successfully');

// Mount complaints router
app.use('/api/complaints', complaintsRouter);

// Mount staff router
app.use('/api/staff', staffRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));

module.exports = app;
