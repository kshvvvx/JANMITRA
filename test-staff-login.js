// Test staff login endpoint specifically
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testStaffLogin() {
  console.log('👮 Testing Staff Login Endpoint\n');
  
  try {
    // Test with valid staff credentials
    console.log('1. Testing staff login with STAFF001...');
    const staffResponse = await fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staff_id: 'STAFF001',
        password: 'password123'
      })
    });
    
    console.log('Staff Response Status:', staffResponse.status);
    const staffText = await staffResponse.text();
    console.log('Staff Response Body:', staffText);
    
    if (staffResponse.ok) {
      const staffData = JSON.parse(staffText);
      console.log('✅ Staff login successful');
      console.log('Token:', staffData.token ? staffData.token.substring(0, 50) + '...' : 'No token');
      
      // Test protected endpoint with staff token
      if (staffData.token) {
        console.log('\n2. Testing staff token on protected endpoint...');
        const protectedResponse = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${staffData.token}` }
        });
        
        console.log('Protected endpoint status:', protectedResponse.status);
        const protectedData = await protectedResponse.json();
        console.log('Protected endpoint response:', protectedData);
      }
    } else {
      console.log('❌ Staff login failed:', staffText);
    }
    
    // Test with supervisor credentials
    console.log('\n3. Testing supervisor login with SUP001...');
    const supResponse = await fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staff_id: 'SUP001',
        password: 'supervisor123'
      })
    });
    
    console.log('Supervisor Response Status:', supResponse.status);
    const supText = await supResponse.text();
    console.log('Supervisor Response Body:', supText);
    
    if (supResponse.ok) {
      console.log('✅ Supervisor login successful');
    } else {
      console.log('❌ Supervisor login failed:', supText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStaffLogin();
