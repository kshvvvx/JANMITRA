const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const AuditLog = require('../backend/models/AuditLog');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

// Sample data generators
const USER_TYPES = ['citizen', 'staff', 'supervisor', 'guest'];
const RESOURCE_TYPES = ['complaint', 'user', 'department', 'media', 'system'];
const ACTIONS = [
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 
  'UPVOTE', 'CONFIRM', 'ESCALATE', 'ASSIGN', 'UPLOAD', 'DOWNLOAD'
];
const DEPARTMENTS = [
  'Water Department', 'Electricity Board', 'Sanitation', 'Roads', 'Public Works'
];

// Generate random date within last 30 days
function randomDate() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random IP address
function randomIP() {
  return [
    Math.floor(Math.random() * 255) + 1,
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255)
  ].join('.');
}

// Generate random user agent
function randomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

// Generate random details based on action and resource type
function generateDetails(action, resourceType) {
  const details = {
    method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'][Math.floor(Math.random() * 5)],
    path: `/api/${resourceType}s`,
    statusCode: Math.random() > 0.9 ? 400 : 200
  };

  if (resourceType === 'complaint') {
    details.complaintId = `COMP-${faker.random.alphaNumeric(8).toUpperCase()}`;
    details.status = ['pending', 'in_progress', 'resolved', 'rejected'][Math.floor(Math.random() * 4)];
    
    if (action === 'STATUS_CHANGE') {
      details.oldStatus = ['pending', 'in_progress', 'resolved', 'rejected'][Math.floor(Math.random() * 4)];
      details.newStatus = ['pending', 'in_progress', 'resolved', 'rejected'][Math.floor(Math.random() * 4)];
      details.comment = faker.lorem.sentence();
    }
  }

  if (resourceType === 'user') {
    details.userId = faker.random.alphaNumeric(24);
    details.email = faker.internet.email();
    
    if (action === 'CREATE' || action === 'UPDATE') {
      details.changes = {
        name: faker.name.findName(),
        role: ['citizen', 'staff', 'supervisor'][Math.floor(Math.random() * 3)],
        department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)]
      };
    }
  }

  return details;
}

// Generate audit logs
async function generateAuditLogs(count = 1000) {
  console.log(`Generating ${count} audit log entries...`);
  
  const logs = [];
  
  for (let i = 0; i < count; i++) {
    const resourceType = RESOURCE_TYPES[Math.floor(Math.random() * RESOURCE_TYPES.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const userType = USER_TYPES[Math.floor(Math.random() * USER_TYPES.length)];
    const departmentId = Math.random() > 0.3 ? faker.random.alphaNumeric(24) : null;
    const success = Math.random() > 0.1; // 90% success rate
    const details = generateDetails(action, resourceType);
    
    const log = {
      user_id: faker.random.alphaNumeric(24),
      user_type: userType,
      action: `${action}_${resourceType.toUpperCase()}`,
      resource_type: resourceType,
      resource_id: faker.random.alphaNumeric(24),
      details,
      ip_address: randomIP(),
      user_agent: randomUserAgent(),
      device_id: faker.random.alphaNumeric(16),
      department_id: departmentId,
      success,
      error_message: success ? null : faker.lorem.sentence(),
      session_id: faker.random.alphaNumeric(32),
      timestamp: randomDate()
    };
    
    logs.push(log);
    
    // Log progress
    if (i > 0 && i % 100 === 0) {
      console.log(`Generated ${i} logs...`);
    }
  }
  
  // Insert logs in batches of 100
  const batchSize = 100;
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    await AuditLog.insertMany(batch);
    console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(logs.length / batchSize)}`);
  }
  
  console.log('Audit log generation complete!');
  mongoose.connection.close();
}

// Parse command line arguments
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 1000;

// Run the generator
generateAuditLogs(count).catch(console.error);
