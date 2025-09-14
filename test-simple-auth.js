// Simple authentication test to verify token generation and usage
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testSimpleAuth() {
  console.log('🔐 Simple Authentication Test\n');
  
  try {
    // 1. Send OTP
    console.log('1. Sending OTP...');
    const otpResponse = await fetch(`${API_BASE}/auth/citizen/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' })
    });
    
    const otpResult = await otpResponse.json();
    console.log('OTP Response:', otpResult);
    
    if (!otpResponse.ok) {
      throw new Error('OTP sending failed');
    }
    
    // 2. Verify OTP
    console.log('\n2. Verifying OTP...');
    const verifyResponse = await fetch(`${API_BASE}/auth/citizen/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '9876543210', 
        otp: otpResult.otp 
      })
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('Verify Response:', verifyResult);
    
    if (!verifyResponse.ok) {
      throw new Error('OTP verification failed');
    }
    
    // 3. Test protected endpoint
    console.log('\n3. Testing protected endpoint...');
    const profileResponse = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${verifyResult.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const profileResult = await profileResponse.json();
    console.log('Profile Response:', profileResult);
    
    if (profileResponse.ok) {
      console.log('✅ Authentication working correctly');
      return verifyResult.token;
    } else {
      console.log('❌ Protected endpoint failed');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

// Run test
testSimpleAuth().then(token => {
  if (token) {
    console.log('\n✅ Token ready for complaint testing');
  }
});
