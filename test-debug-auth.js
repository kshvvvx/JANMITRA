// Debug authentication flow to identify the exact issue
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function debugAuth() {
  console.log('🔍 Debugging Authentication Flow\n');
  
  try {
    // 1. Get token
    const otpResponse = await fetch(`${API_BASE}/auth/citizen/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' })
    });
    
    const otpResult = await otpResponse.json();
    console.log('1. OTP Response:', otpResult);
    
    const verifyResponse = await fetch(`${API_BASE}/auth/citizen/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '9876543210', 
        otp: otpResult.otp 
      })
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('2. Verify Response:', verifyResult);
    
    const token = verifyResult.token;
    console.log('3. Token:', token.substring(0, 50) + '...');
    
    // 2. Test token directly on auth endpoint
    console.log('\n--- Testing token on /auth/me ---');
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Me Response Status:', meResponse.status);
    const meResult = await meResponse.json();
    console.log('Me Response Body:', meResult);
    
    // 3. Test token on complaints endpoint with detailed logging
    console.log('\n--- Testing token on /complaints ---');
    console.log('Request headers:', {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    const complaintResponse = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Debug test complaint',
        location: {
          lat: 28.7041,
          lng: 77.1025,
          address: 'Debug Location'
        }
      })
    });
    
    console.log('Complaint Response Status:', complaintResponse.status);
    console.log('Complaint Response Headers:', Object.fromEntries(complaintResponse.headers));
    
    const complaintText = await complaintResponse.text();
    console.log('Complaint Response Body:', complaintText);
    
    // 4. Test a simple GET endpoint
    console.log('\n--- Testing GET /complaints ---');
    const getResponse = await fetch(`${API_BASE}/complaints`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('GET Response Status:', getResponse.status);
    const getResult = await getResponse.text();
    console.log('GET Response Body:', getResult.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAuth();
