const axios = require('axios');

async function testComplaint() {
  try {
    console.log('🚀 Starting test...');
    
    // 1. Get auth token
    console.log('\n1. Getting auth token...');
    const phone = '9876543210';
    
    // Send OTP
    const otpResponse = await axios.post('http://localhost:5000/api/auth/citizen/send-otp', { phone });
    console.log('OTP sent:', otpResponse.data);
    
    // Use the OTP from response or default test OTP
    const otp = otpResponse.data.otp || '123456';
    
    // Verify OTP
    const verifyResponse = await axios.post('http://localhost:5000/api/auth/citizen/verify-otp', {
      phone,
      otp,
      name: 'Test User'
    });
    
    const token = verifyResponse.data.token;
    console.log('Auth token received');
    
    // 2. Test complaint submission
    console.log('\n2. Submitting test complaint...');
    const complaintData = {
      description: 'Simple test complaint',
      category: 'water',
      location: {
        address: '123 Test St, Bangalore',
        lat: 12.9716,
        lng: 77.5946
      },
      media: ['test.jpg']
    };
    
    console.log('Sending complaint data:', JSON.stringify(complaintData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/complaints', complaintData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Complaint submitted successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    
    if (error.config) {
      console.error('Request config:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data
      });
    }
  }
}

testComplaint();
