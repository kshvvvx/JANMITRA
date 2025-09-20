const axios = require('axios');
const BACKEND_URL = 'http://localhost:5000';

// Enable axios request/response logging
axios.interceptors.request.use(request => {
  console.log('Request:', {
    method: request.method,
    url: request.url,
    headers: request.headers,
    data: request.data
  });
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  error => {
    if (error.response) {
      console.error('Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

async function testFullFlow() {
  try {
    console.log('🚀 Starting end-to-end test...');
    
    // 1. Send OTP
    console.log('\n1. Sending OTP...');
    const phone = '9876543210';
    
    console.log(`Sending OTP to ${phone}...`);
    const otpResponse = await axios.post(
      `${BACKEND_URL}/api/auth/citizen/send-otp`, 
      { phone },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 // 5 seconds timeout
      }
    );
    
    console.log('OTP Response:', otpResponse.data);
    
    if (!otpResponse.data.success) {
      throw new Error('Failed to send OTP');
    }
    
    // 2. Verify OTP
    console.log('\n2. Verifying OTP...');
    const otp = otpResponse.data.otp || '123456'; // Use received OTP or default test OTP
    const verifyResponse = await axios.post(`${BACKEND_URL}/api/auth/citizen/verify-otp`, {
      phone,
      otp,
      name: 'Test User'
    });
    
    console.log('Verify OTP Response:', {
      status: verifyResponse.status,
      data: {
        success: verifyResponse.data.success,
        token: verifyResponse.data.token ? 'Token received' : 'No token',
        user: verifyResponse.data.user ? 'User data received' : 'No user data'
      }
    });
    
    if (!verifyResponse.data.token) {
      throw new Error('Failed to verify OTP');
    }
    
    const token = verifyResponse.data.token;
    
    // 3. Test Complaint Submission with AI Integration
    console.log('\n3. Testing complaint submission with AI integration...');
    const testComplaint = {
      description: 'Broken water pipe flooding the street near the park',
      category: 'water',
      location: {
        address: 'Test Location, Bangalore',
        lat: 12.9716,
        lng: 77.5946
      },
      media: ['test-image.jpg']
    };
    
    console.log('Sending complaint data:', JSON.stringify(testComplaint, null, 2));
    
    try {
      const complaintResponse = await axios.post(
        `${BACKEND_URL}/api/complaints`,
        testComplaint,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );
      return complaintResponse;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
    
    console.log('\n4. Complaint Submission Result:', {
      status: complaintResponse.status,
      data: {
        complaint_id: complaintResponse.data.complaint_id,
        status: complaintResponse.data.status,
        dangerScore: complaintResponse.data.dangerScore,
        hasAutoDescription: !!complaintResponse.data.autoDescription
      }
    });
    
    // 5. Verify the complaint was enhanced with AI
    if (complaintResponse.data.dangerScore === undefined) {
      console.warn('⚠️ Warning: Complaint was not enhanced with danger score');
    } else {
      console.log('✅ AI Integration: Danger score was added to complaint');
    }
    
    console.log('\n🎉 End-to-end test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    process.exit(1);
  }
}

testFullFlow();
