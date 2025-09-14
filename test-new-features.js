const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  citizen: {
    phone: '9876543210',
    name: 'Test Citizen'
  },
  department: {
    unique_id: 'DEPT-MUM-ROADS-001',
    staff_id: 'STAFF001',
    device_id: 'DEVICE123'
  },
  supervisor: {
    id: 'SUP001',
    password: 'supervisor123'
  }
};

let citizenToken = '';
let departmentToken = '';
let supervisorToken = '';
let testComplaintId = '';

async function testCitizenAuth() {
  console.log('\n=== Testing Citizen Authentication ===');
  
  try {
    // Send OTP
    const otpResponse = await axios.post(`${API_BASE}/auth/citizen/send-otp`, {
      phone: testConfig.citizen.phone
    });
    console.log('✅ OTP sent successfully');
    
    // Verify OTP (using mock OTP)
    const verifyResponse = await axios.post(`${API_BASE}/auth/citizen/verify-otp`, {
      phone: testConfig.citizen.phone,
      otp: '123456'
    });
    
    citizenToken = verifyResponse.data.token;
    console.log('✅ Citizen authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Citizen auth failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGuestMode() {
  console.log('\n=== Testing Guest Mode Complaint Creation ===');
  
  try {
    const guestComplaint = await axios.post(`${API_BASE}/complaints`, {
      citizen_id: 'guest_' + Date.now(),
      description: 'Guest mode test complaint - broken streetlight',
      location: {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Mumbai, Maharashtra, India',
        state: 'Maharashtra',
        city: 'Mumbai',
        area: 'Bandra'
      },
      media: [],
      user_type: 'guest',
      guest_name: testConfig.citizen.name,
      guest_phone: testConfig.citizen.phone
    });
    
    console.log('✅ Guest complaint created:', guestComplaint.data.complaint_id);
    return true;
  } catch (error) {
    console.error('❌ Guest mode failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDepartmentAuth() {
  console.log('\n=== Testing Department-Based Authentication ===');
  
  try {
    const loginResponse = await axios.post(`${API_BASE}/departments/login`, {
      department_id: testConfig.department.unique_id,
      staff_id: testConfig.department.staff_id,
      device_id: testConfig.department.device_id
    });
    
    if (loginResponse.status === 202) {
      console.log('⚠️ Secondary device login requires supervisor approval');
      return false;
    }
    
    departmentToken = loginResponse.data.token;
    console.log('✅ Department authentication successful');
    console.log('Department:', loginResponse.data.department.name);
    return true;
  } catch (error) {
    console.error('❌ Department auth failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSupervisorAuth() {
  console.log('\n=== Testing Supervisor Authentication ===');
  
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/staff/login`, {
      staff_id: testConfig.supervisor.id,
      password: testConfig.supervisor.password
    });
    
    supervisorToken = loginResponse.data.token;
    console.log('✅ Supervisor authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Supervisor auth failed:', error.response?.data || error.message);
    return false;
  }
}

async function testComplaintWithAI() {
  console.log('\n=== Testing Complaint Creation with AI Features ===');
  
  try {
    const complaintResponse = await axios.post(`${API_BASE}/complaints`, {
      citizen_id: 'test_citizen_' + Date.now(),
      description: 'Dangerous pothole causing accidents on main road. Multiple vehicles damaged. Urgent repair needed.',
      location: {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Main Road, Bandra West, Mumbai, Maharashtra',
        state: 'Maharashtra',
        city: 'Mumbai',
        area: 'Bandra West'
      },
      media: [
        { type: 'image', url: 'test_image_1.jpg' },
        { type: 'image', url: 'test_image_2.jpg' }
      ]
    }, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    
    testComplaintId = complaintResponse.data.complaint_id;
    console.log('✅ Complaint created with ID:', testComplaintId);
    console.log('Danger Score:', complaintResponse.data.dangerScore);
    console.log('Brief Description:', complaintResponse.data.briefDescription);
    return true;
  } catch (error) {
    console.error('❌ AI complaint creation failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCitizenVoting() {
  console.log('\n=== Testing New Citizen Voting System ===');
  
  try {
    // First, mark complaint as resolved (simulate staff action)
    await axios.put(`${API_BASE}/complaints/${testComplaintId}/status`, {
      status: 'awaiting_citizen_confirmation',
      comment: 'Issue has been fixed, awaiting citizen confirmation'
    }, {
      headers: { Authorization: `Bearer ${departmentToken || citizenToken}` }
    });
    
    console.log('✅ Complaint marked as awaiting citizen confirmation');
    
    // Test citizen voting
    const voteResponse = await axios.post(`${API_BASE}/complaints/${testComplaintId}/citizen-vote`, {
      vote: 'yes'
    }, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    
    console.log('✅ Citizen vote recorded:', voteResponse.data.vote_recorded);
    console.log('Yes votes:', voteResponse.data.yes_votes);
    console.log('Status:', voteResponse.data.status);
    return true;
  } catch (error) {
    console.error('❌ Citizen voting failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSupervisorChat() {
  console.log('\n=== Testing Supervisor Chat System ===');
  
  if (!supervisorToken) {
    console.log('⚠️ Skipping supervisor chat test - no supervisor token');
    return false;
  }
  
  try {
    // Create/get chat with department
    const chatResponse = await axios.post(`${API_BASE}/supervisor/chats/${testConfig.department.unique_id}`, {}, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    
    const chatId = chatResponse.data.chat_id;
    console.log('✅ Chat created/retrieved:', chatId);
    
    // Send message
    await axios.post(`${API_BASE}/supervisor/chats/${chatId}/messages`, {
      message: 'Please prioritize complaint ' + testComplaintId,
      message_type: 'complaint_reference',
      complaint_id: testComplaintId
    }, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    
    console.log('✅ Message sent in supervisor chat');
    
    // Mark complaint as urgent
    await axios.post(`${API_BASE}/supervisor/complaints/${testComplaintId}/mark-urgent`, {
      urgency_level: 'high',
      reason: 'Multiple accidents reported'
    }, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    
    console.log('✅ Complaint marked as urgent by supervisor');
    return true;
  } catch (error) {
    console.error('❌ Supervisor chat failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAuditLogging() {
  console.log('\n=== Testing Audit Logging System ===');
  
  try {
    // Connect to MongoDB to check audit logs
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra');
    
    const AuditLog = require('./backend/models/AuditLog');
    
    // Get recent audit logs
    const recentLogs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    
    console.log('✅ Recent audit logs found:', recentLogs.length);
    
    recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} by ${log.user_type} ${log.user_id} at ${log.timestamp}`);
    });
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Audit logging test failed:', error.message);
    return false;
  }
}

async function testDepartmentMetrics() {
  console.log('\n=== Testing Department Performance Metrics ===');
  
  if (!departmentToken) {
    console.log('⚠️ Skipping department metrics test - no department token');
    return false;
  }
  
  try {
    const metricsResponse = await axios.get(`${API_BASE}/departments/${testConfig.department.unique_id}/metrics`, {
      headers: { Authorization: `Bearer ${departmentToken}` }
    });
    
    console.log('✅ Department metrics retrieved');
    console.log('Total complaints received:', metricsResponse.data.metrics.total_complaints_received);
    console.log('Total complaints resolved:', metricsResponse.data.metrics.total_complaints_resolved);
    console.log('Efficiency score:', metricsResponse.data.metrics.efficiency_score);
    return true;
  } catch (error) {
    console.error('❌ Department metrics failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting JANMITRA New Features Test Suite');
  console.log('='.repeat(50));
  
  const results = {
    citizenAuth: await testCitizenAuth(),
    guestMode: await testGuestMode(),
    departmentAuth: await testDepartmentAuth(),
    supervisorAuth: await testSupervisorAuth(),
    complaintWithAI: await testComplaintWithAI(),
    citizenVoting: await testCitizenVoting(),
    supervisorChat: await testSupervisorChat(),
    auditLogging: await testAuditLogging(),
    departmentMetrics: await testDepartmentMetrics()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${test.padEnd(20)} ${status}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 OVERALL: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All new features are working correctly!');
  } else {
    console.log('⚠️ Some features need attention before deployment');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
