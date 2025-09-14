#!/usr/bin/env node
/**
 * JANMITRA Comprehensive System Test
 * Tests all backend endpoints, authentication, complaints, and features
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const BACKEND_BASE = 'http://localhost:5000';

// Test data
const TEST_CITIZENS = [
  { phone: '9876543210', name: 'Test Citizen 1' },
  { phone: '9876543211', name: 'Test Citizen 2' },
  { phone: '9876543212', name: 'Test Citizen 3' }
];

const TEST_STAFF = {
  staff_id: 'STAFF001',
  password: 'password123'
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logResult(testName, success, error = null) {
  if (success) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: ${error}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error });
  }
}

// Test backend health endpoints
async function testBackendHealth() {
  console.log('\n🏥 Testing Backend Health...');
  
  try {
    const response = await fetch(`${BACKEND_BASE}/health`);
    logResult('Backend health endpoint', response.ok);
    
    const apiHealth = await fetch(`${API_BASE}/health`);
    logResult('API health endpoint', apiHealth.ok);
  } catch (error) {
    logResult('Backend health', false, error.message);
  }
}

// Test authentication endpoints
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test citizen OTP flow
    const otpResponse = await fetch(`${API_BASE}/auth/citizen/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: TEST_CITIZENS[0].phone })
    });
    logResult('Citizen OTP send', otpResponse.ok);
    
    if (otpResponse.ok) {
      const otpData = await otpResponse.json();
      const otp = otpData.otp || '123456';
      
      const verifyResponse = await fetch(`${API_BASE}/auth/citizen/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TEST_CITIZENS[0].phone, otp })
      });
      
      if (verifyResponse.ok) {
        const loginData = await verifyResponse.json();
        logResult('Citizen OTP verify', !!loginData.token);
        return loginData.token;
      } else {
        logResult('Citizen OTP verify', false, 'Verification failed');
      }
    }
    
    // Test staff login
    const staffResponse = await fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_STAFF)
    });
    logResult('Staff login', staffResponse.ok);
    
  } catch (error) {
    logResult('Authentication tests', false, error.message);
  }
  
  return null;
}

// Test complaint CRUD operations
async function testComplaints(citizenToken) {
  console.log('\n📋 Testing Complaint Operations...');
  
  try {
    if (!citizenToken) {
      logResult('Complaint tests', false, 'No citizen token available');
      return null;
    }
    
    // Test complaint creation
    const createResponse = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${citizenToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Test complaint for system testing',
        location: {
          lat: 28.7041,
          lng: 77.1025,
          address: 'Test Location, New Delhi'
        }
      })
    });
    
    if (createResponse.ok) {
      const complaintData = await createResponse.json();
      logResult('Complaint creation', !!complaintData.complaint_id);
      
      const complaintId = complaintData.complaint_id;
      
      // Test complaint listing
      const listResponse = await fetch(`${API_BASE}/complaints`);
      logResult('Complaint listing', listResponse.ok);
      
      // Test complaint details
      const detailResponse = await fetch(`${API_BASE}/complaints/${complaintId}`);
      logResult('Complaint details', detailResponse.ok);
      
      // Test complaint upvote
      const upvoteResponse = await fetch(`${API_BASE}/complaints/${complaintId}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${citizenToken}` }
      });
      logResult('Complaint upvote', upvoteResponse.ok);
      
      return complaintId;
    } else {
      const errorText = await createResponse.text();
      logResult('Complaint creation', false, errorText);
    }
  } catch (error) {
    logResult('Complaint operations', false, error.message);
  }
  
  return null;
}

// Test complaint status updates (staff operations)
async function testStaffOperations(complaintId) {
  console.log('\n👮 Testing Staff Operations...');
  
  try {
    // Login as staff
    const staffResponse = await fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_STAFF)
    });
    
    if (staffResponse.ok) {
      const staffData = await staffResponse.json();
      const staffToken = staffData.token;
      
      if (complaintId) {
        // Test status update
        const statusResponse = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${staffToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'in-progress',
            comment: 'Staff is reviewing this complaint'
          })
        });
        logResult('Complaint status update', statusResponse.ok);
        
        // Test setting to awaiting_confirmation
        const awaitingResponse = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${staffToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'awaiting_confirmation',
            comment: 'Issue resolved, awaiting citizen confirmation'
          })
        });
        logResult('Set awaiting_confirmation status', awaitingResponse.ok);
      }
    } else {
      logResult('Staff login for operations', false, 'Login failed');
    }
  } catch (error) {
    logResult('Staff operations', false, error.message);
  }
}

// Test complaint confirmation system
async function testComplaintConfirmation(complaintId) {
  console.log('\n✅ Testing Complaint Confirmation...');
  
  try {
    if (!complaintId) {
      logResult('Complaint confirmation', false, 'No complaint ID available');
      return;
    }
    
    // Login multiple citizens for confirmation testing
    const citizenTokens = [];
    
    for (let i = 0; i < 3; i++) {
      const citizen = TEST_CITIZENS[i];
      const otpResponse = await fetch(`${API_BASE}/auth/citizen/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: citizen.phone })
      });
      
      if (otpResponse.ok) {
        const otpData = await otpResponse.json();
        const otp = otpData.otp || '123456';
        
        const verifyResponse = await fetch(`${API_BASE}/auth/citizen/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: citizen.phone, otp })
        });
        
        if (verifyResponse.ok) {
          const loginData = await verifyResponse.json();
          citizenTokens.push(loginData.token);
        }
      }
    }
    
    // Test confirmations
    for (let i = 0; i < citizenTokens.length; i++) {
      const confirmResponse = await fetch(`${API_BASE}/complaints/${complaintId}/confirm-resolution`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${citizenTokens[i]}` }
      });
      
      if (confirmResponse.ok) {
        const confirmData = await confirmResponse.json();
        logResult(`Confirmation ${i + 1}`, true);
        
        if (confirmData.resolved) {
          logResult('Auto-resolution after 3+ confirmations', true);
          break;
        }
      } else {
        logResult(`Confirmation ${i + 1}`, false, 'Confirmation failed');
      }
    }
    
    // Test manual auto-resolution trigger
    const triggerResponse = await fetch(`${API_BASE}/complaints/trigger-auto-resolution`, {
      method: 'POST'
    });
    logResult('Manual auto-resolution trigger', triggerResponse.ok);
    
  } catch (error) {
    logResult('Complaint confirmation', false, error.message);
  }
}

// Test push notification endpoints
async function testPushNotifications(citizenToken) {
  console.log('\n📱 Testing Push Notifications...');
  
  try {
    if (!citizenToken) {
      logResult('Push notification tests', false, 'No citizen token available');
      return;
    }
    
    // Test push token registration
    const tokenResponse = await fetch(`${API_BASE}/auth/push-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${citizenToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: `ExponentPushToken[test-${Date.now()}]`,
        deviceId: 'test-device-123',
        platform: 'android'
      })
    });
    logResult('Push token registration', tokenResponse.ok);
    
  } catch (error) {
    logResult('Push notifications', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 JANMITRA Comprehensive System Test\n');
  console.log('Testing all backend endpoints, authentication, and features...\n');
  
  // Test 1: Backend Health
  await testBackendHealth();
  
  // Test 2: Authentication
  const citizenToken = await testAuthentication();
  
  // Test 3: Complaint Operations
  const complaintId = await testComplaints(citizenToken);
  
  // Test 4: Staff Operations
  await testStaffOperations(complaintId);
  
  // Test 5: Complaint Confirmation
  await testComplaintConfirmation(complaintId);
  
  // Test 6: Push Notifications
  await testPushNotifications(citizenToken);
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🐛 Errors to fix:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  } else {
    console.log('\n🎉 All tests passed! System is working correctly.');
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
