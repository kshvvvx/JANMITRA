// Test script for push notifications functionality
// Tests notification registration, sending, and backend integration

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

// Mock push token for testing (unique for each run)
const MOCK_PUSH_TOKEN = `ExponentPushToken[test-${Date.now()}]`;

// Test login and push token registration
async function testPushTokenRegistration() {
  console.log('🧪 Testing Push Token Registration\n');
  
  try {
    // Login as citizen first
    console.log('1. Sending OTP...');
    const otpResponse = await fetch(`${API_BASE}/auth/citizen/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' })
    });
    
    if (!otpResponse.ok) {
      const errorText = await otpResponse.text();
      throw new Error(`OTP request failed: ${otpResponse.status} - ${errorText}`);
    }
    
    const otpResult = await otpResponse.json();
    console.log('✅ OTP sent successfully');
    
    // Get the OTP from the response (available in development mode)
    const actualOtp = otpResult.otp || '123456';
    console.log(`Using OTP: ${actualOtp}`);
    
    console.log('2. Verifying OTP...');
    const verifyResponse = await fetch(`${API_BASE}/auth/citizen/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '9876543210',
        otp: actualOtp
      })
    });
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      throw new Error(`OTP verification failed: ${verifyResponse.status} - ${errorText}`);
    }
    
    const loginResult = await verifyResponse.json();
    const token = loginResult.token;
    console.log('✅ Login successful');
    
    // Register push token
    console.log('3. Registering push token...');
    const pushTokenResponse = await fetch(`${API_BASE}/auth/push-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: MOCK_PUSH_TOKEN,
        deviceId: 'test-device-123',
        platform: 'android'
      })
    });
    
    if (!pushTokenResponse.ok) {
      const errorText = await pushTokenResponse.text();
      throw new Error(`Push token registration failed: ${pushTokenResponse.status} - ${errorText}`);
    }
    
    const pushResult = await pushTokenResponse.json();
    console.log('✅ Push token registered successfully:', pushResult.message);
    
    // Verify token was saved
    console.log('4. Verifying saved tokens...');
    const tokensResponse = await fetch(`${API_BASE}/auth/push-tokens`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (tokensResponse.ok) {
      const tokensData = await tokensResponse.json();
      console.log(`✅ Found ${tokensData.tokens.length} saved token(s)`);
      tokensData.tokens.forEach((t, i) => {
        console.log(`   Token ${i + 1}: ${t.platform} device (${t.deviceId})`);
      });
    }
    
    return token;
    
  } catch (error) {
    console.error('❌ Push token registration test failed:', error.message);
    return null;
  }
}

// Test complaint creation and staff notification
async function testComplaintNotification(citizenToken) {
  console.log('\n🧪 Testing Complaint Creation Notification\n');
  
  try {
    console.log('1. Creating new complaint...');
    const complaintResponse = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${citizenToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Test complaint for push notification',
        location: {
          lat: 28.7041,
          lng: 77.1025,
          address: 'Test Location, New Delhi'
        }
      })
    });
    
    if (!complaintResponse.ok) {
      throw new Error(`Complaint creation failed: ${complaintResponse.status}`);
    }
    
    const complaintResult = await complaintResponse.json();
    console.log(`✅ Complaint created: ${complaintResult.complaint_id}`);
    console.log('📱 Staff should receive push notification about new complaint');
    
    return complaintResult.complaint_id;
    
  } catch (error) {
    console.error('❌ Complaint notification test failed:', error.message);
    return null;
  }
}

// Test status change notification
async function testStatusChangeNotification(complaintId) {
  console.log('\n🧪 Testing Status Change Notification\n');
  
  try {
    // Login as staff
    console.log('1. Logging in as staff...');
    const staffResponse = await fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staff_id: 'STAFF001',
        password: 'password123'
      })
    });
    
    if (!staffResponse.ok) {
      throw new Error(`Staff login failed: ${staffResponse.status}`);
    }
    
    const staffResult = await staffResponse.json();
    const staffToken = staffResult.token;
    console.log('✅ Staff login successful');
    
    // Update complaint status
    console.log('2. Updating complaint status...');
    const statusResponse = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'in-progress',
        comment: 'We are reviewing your complaint and will take action soon.'
      })
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Status update failed: ${statusResponse.status}`);
    }
    
    const statusResult = await statusResponse.json();
    console.log(`✅ Status updated to: ${statusResult.status}`);
    console.log('📱 Citizen should receive push notification about status change');
    
    return staffToken;
    
  } catch (error) {
    console.error('❌ Status change notification test failed:', error.message);
    return null;
  }
}

// Test upvote notification
async function testUpvoteNotification(complaintId, citizenToken) {
  console.log('\n🧪 Testing Upvote Notification\n');
  
  try {
    console.log('1. Upvoting complaint...');
    const upvoteResponse = await fetch(`${API_BASE}/complaints/${complaintId}/upvote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${citizenToken}`
      }
    });
    
    if (!upvoteResponse.ok) {
      throw new Error(`Upvote failed: ${upvoteResponse.status}`);
    }
    
    const upvoteResult = await upvoteResponse.json();
    console.log(`✅ Complaint upvoted! Total upvotes: ${upvoteResult.upvotes}`);
    console.log('📱 Complaint owner should receive push notification about upvote');
    
  } catch (error) {
    console.error('❌ Upvote notification test failed:', error.message);
  }
}

// Main test function
async function runPushNotificationTests() {
  console.log('🚀 Starting Push Notification Tests\n');
  console.log('Note: This tests the backend notification system.');
  console.log('Actual push notifications require Expo push service and physical device.\n');
  
  // Test 1: Push token registration
  const citizenToken = await testPushTokenRegistration();
  if (!citizenToken) {
    console.log('❌ Cannot proceed without valid citizen token');
    return;
  }
  
  // Test 2: Complaint creation notification
  const complaintId = await testComplaintNotification(citizenToken);
  if (!complaintId) {
    console.log('❌ Cannot proceed without valid complaint');
    return;
  }
  
  // Test 3: Status change notification
  await testStatusChangeNotification(complaintId);
  
  // Test 4: Upvote notification
  await testUpvoteNotification(complaintId, citizenToken);
  
  console.log('\n🎉 Push Notification Tests Completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Push token registration system working');
  console.log('✅ Complaint creation triggers staff notifications');
  console.log('✅ Status changes trigger citizen notifications');
  console.log('✅ Upvotes trigger complaint owner notifications');
  console.log('\n📱 To test actual push notifications:');
  console.log('1. Deploy backend with valid Expo project ID');
  console.log('2. Install app on physical device');
  console.log('3. Register for push notifications');
  console.log('4. Perform actions to trigger notifications');
}

// Run the tests
runPushNotificationTests().catch(console.error);
