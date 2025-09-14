#!/usr/bin/env node
/**
 * JANMITRA Authentication System Test
 * Tests the new phone/OTP authentication flow
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:5000';

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData, ok: res.statusCode < 400 });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, ok: res.statusCode < 400 });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAuthentication() {
  console.log('🔐 Testing JANMITRA Authentication System...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing backend health...');
    const health = await makeRequest(`${BACKEND_URL}/api/health`);
    if (health.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend not running');
      return;
    }

    // Test 2: Send OTP
    console.log('\n2. Testing OTP sending...');
    const phoneNumber = '+919876543210';
    const sendOTP = await makeRequest(`${BACKEND_URL}/api/auth/send-otp`, 'POST', {
      phoneNumber
    });
    
    if (sendOTP.ok && sendOTP.data.success) {
      console.log('✅ OTP sent successfully');
      console.log(`   Phone: ${phoneNumber}`);
      if (sendOTP.data.otp) {
        console.log(`   OTP: ${sendOTP.data.otp} (development mode)`);
      }
    } else {
      console.log('❌ OTP sending failed:', sendOTP.data);
      return;
    }

    // Test 3: Verify OTP (using the OTP from response)
    console.log('\n3. Testing OTP verification...');
    const otp = sendOTP.data.otp || '123456'; // Use actual OTP or fallback
    const verifyOTP = await makeRequest(`${BACKEND_URL}/api/auth/verify-otp`, 'POST', {
      phoneNumber,
      otp
    });
    
    if (verifyOTP.ok && verifyOTP.data.success) {
      console.log('✅ OTP verified successfully');
      console.log(`   User ID: ${verifyOTP.data.user.id}`);
      console.log(`   Phone: ${verifyOTP.data.user.phoneNumber}`);
      console.log(`   Language: ${verifyOTP.data.user.language}`);
      console.log(`   User Type: ${verifyOTP.data.user.userType}`);
    } else {
      console.log('❌ OTP verification failed:', verifyOTP.data);
    }

    // Test 4: Get user profile
    console.log('\n4. Testing user profile retrieval...');
    const profile = await makeRequest(`${BACKEND_URL}/api/auth/profile?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    
    if (profile.ok && profile.data.success) {
      console.log('✅ User profile retrieved successfully');
      console.log(`   Name: ${profile.data.user.name || 'Not set'}`);
      console.log(`   Created: ${profile.data.user.createdAt}`);
    } else {
      console.log('❌ Profile retrieval failed:', profile.data);
    }

    console.log('\n🎉 Authentication system test complete!');
    console.log('\nNext Steps:');
    console.log('1. Open the mobile app and test the authentication flow');
    console.log('2. Try language selection (English/Hindi)');
    console.log('3. Test user mode selection (Citizen/Staff/Supervisor)');
    console.log('4. Test phone number and OTP verification');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAuthentication().catch(console.error);
