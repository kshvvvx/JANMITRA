const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:5000';

// Test data for backend
const testComplaint = {
  description: 'There is a large pothole on Main Street causing traffic issues',
  category: 'road',
  location: {
    address: '123 Main Street, Bangalore, India',
    lat: 12.9716,
    lng: 77.5946
  },
  media: ['image1.jpg']
};

// For AI service which expects separate latitude/longitude
const aiTestData = {
  description: 'There is a large pothole on Main Street causing traffic issues',
  category: 'road',
  location: {
    latitude: 12.9716,
    longitude: 77.5946
  },
  media_type: 'image',
  media_count: 1
};

// Test the AI service directly
async function testAIService() {
  try {
    console.log('Testing AI Service Directly...');
    
    // Test danger score
    const dangerScoreRes = await axios.post('http://localhost:8000/api/ai/danger-score', {
      description: aiTestData.description,
      category: aiTestData.category,
      location: aiTestData.location,
      media_type: aiTestData.media_type,
      media_count: aiTestData.media_count
    });
    
    console.log('Danger Score Response:', JSON.stringify(dangerScoreRes.data, null, 2));
    
    // Test auto description
    const autoDescRes = await axios.post('http://localhost:8000/api/ai/auto-description', {
      description: aiTestData.description,
      category: aiTestData.category,
      location: aiTestData.location,
      media_type: aiTestData.media_type
    });
    
    console.log('Auto Description Response:', JSON.stringify(autoDescRes.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('AI Service Test Failed:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Status:', error.response.status);
    }
    return false;
  }
}

// Test the backend API
async function testBackendAPI() {
  try {
    console.log('\nTesting Backend API...');
    
    // First, send OTP to get the OTP code in development mode
    const otpResponse = await axios.post(`${BACKEND_URL}/api/auth/citizen/send-otp`, {
      phone: '9876543210'
    });
    
    // In development, the OTP is returned in the response
    const otp = otpResponse.data.otp || '123456'; // Fallback to default OTP if not in response
    
    // Then verify OTP with the received OTP
    const authRes = await axios.post(`${BACKEND_URL}/api/auth/citizen/verify-otp`, {
      phone: '9876543210',
      otp: otp
    });
    
    const token = authRes.data.token;
    console.log('Authenticated with token:', token ? 'Success' : 'Failed');
    
    // Create a new complaint
    const complaintRes = await axios.post(
      `${BACKEND_URL}/api/complaints`,
      testComplaint,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Created Complaint:', JSON.stringify(complaintRes.data, null, 2));
    
    // Check if the complaint has a danger score
    if (complaintRes.data.dangerScore) {
      console.log('Danger Score:', complaintRes.data.dangerScore);
    }
    
    return true;
  } catch (error) {
    console.error('Backend API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Status:', error.response.status);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Starting AI Integration Tests...');
  
  console.log('\n=== Testing AI Service ===');
  const aiServiceTest = await testAIService();
  
  console.log('\n=== Testing Backend Integration ===');
  const backendTest = await testBackendAPI();
  
  console.log('\n=== Test Results ===');
  console.log('AI Service:', aiServiceTest ? '✅ PASSED' : '❌ FAILED');
  console.log('Backend Integration:', backendTest ? '✅ PASSED' : '❌ FAILED');
  
  if (aiServiceTest && backendTest) {
    console.log('\n🎉 All tests passed! The AI integration is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the error messages above.');
  }
}

// Run the tests
runTests().catch(console.error);
