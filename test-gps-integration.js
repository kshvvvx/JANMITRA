// Test script for GPS location integration
// Creates test complaints with GPS coordinates and tests nearby functionality

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

// Test coordinates (Delhi area)
const testLocations = [
  { lat: 28.7041, lng: 77.1025, address: "Connaught Place, New Delhi" },
  { lat: 28.6139, lng: 77.2090, address: "India Gate, New Delhi" },
  { lat: 28.5562, lng: 77.1000, address: "Gurgaon, Haryana" },
  { lat: 28.4595, lng: 77.0266, address: "Dwarka, New Delhi" },
  { lat: 28.7041, lng: 77.1030, address: "Near Connaught Place, New Delhi" }, // Very close to first one
];

const testComplaints = [
  "Pothole on main road causing traffic issues",
  "Street light not working for past week", 
  "Garbage not collected for 3 days",
  "Water logging during rain",
  "Broken footpath near metro station"
];

// Login as citizen first
async function loginAsCitizen() {
  try {
    // Send OTP
    const otpResponse = await fetch(`${API_BASE}/auth/citizen/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210' })
    });
    
    if (!otpResponse.ok) {
      throw new Error(`OTP request failed: ${otpResponse.status}`);
    }
    
    // Verify OTP (using mock OTP 123456)
    const verifyResponse = await fetch(`${API_BASE}/auth/citizen/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '+919876543210',
        otp: '123456'
      })
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`OTP verification failed: ${verifyResponse.status}`);
    }
    
    const result = await verifyResponse.json();
    return result.token;
    
  } catch (error) {
    console.error('Login failed:', error.message);
    return null;
  }
}

// Create test complaints with GPS coordinates
async function createTestComplaints(token) {
  console.log('Creating test complaints with GPS coordinates...');
  
  for (let i = 0; i < testLocations.length; i++) {
    const location = testLocations[i];
    const description = testComplaints[i];
    
    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          location
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created complaint ${result.complaint_id} at ${location.address}`);
      } else {
        console.log(`❌ Failed to create complaint at ${location.address}: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`Error creating complaint ${i + 1}:`, error.message);
    }
  }
}

// Test nearby complaints functionality
async function testNearbyComplaints(token) {
  console.log('\nTesting nearby complaints functionality...');
  
  // Test from Connaught Place (should find complaints within radius)
  const searchLat = 28.7041;
  const searchLng = 77.1025;
  const radius = 5; // 5km radius
  
  try {
    const response = await fetch(`${API_BASE}/complaints/nearby/${searchLat}/${searchLng}?radius=${radius}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nearby complaints request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`\n📍 Search location: ${searchLat}, ${searchLng}`);
    console.log(`🔍 Search radius: ${radius}km`);
    console.log(`📊 Found ${data.count} nearby complaints:`);
    
    data.complaints.forEach((complaint, index) => {
      console.log(`\n${index + 1}. ${complaint.description}`);
      console.log(`   📍 ${complaint.location.address}`);
      console.log(`   📏 Distance: ${complaint.distance}km`);
      console.log(`   📊 Status: ${complaint.status}`);
      console.log(`   👍 Upvotes: ${complaint.upvotes}`);
    });
    
    // Test with smaller radius
    console.log('\n\nTesting with smaller radius (1km)...');
    const smallRadiusResponse = await fetch(`${API_BASE}/complaints/nearby/${searchLat}/${searchLng}?radius=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (smallRadiusResponse.ok) {
      const smallRadiusData = await smallRadiusResponse.json();
      console.log(`Found ${smallRadiusData.count} complaints within 1km`);
    }
    
  } catch (error) {
    console.error('Error testing nearby complaints:', error.message);
  }
}

// Test location validation
async function testLocationValidation(token) {
  console.log('\n\nTesting location validation...');
  
  // Test invalid coordinates
  const invalidTests = [
    { lat: 91, lng: 77, desc: "Invalid latitude > 90" },
    { lat: 28, lng: 181, desc: "Invalid longitude > 180" },
    { lat: "invalid", lng: 77, desc: "Non-numeric latitude" },
    { lat: 28, lng: null, desc: "Null longitude" }
  ];
  
  for (const test of invalidTests) {
    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: "Test complaint with invalid location",
          location: {
            lat: test.lat,
            lng: test.lng,
            address: "Test address"
          }
        })
      });
      
      if (response.ok) {
        console.log(`❌ ${test.desc}: Should have failed but succeeded`);
      } else {
        const error = await response.json();
        console.log(`✅ ${test.desc}: Correctly rejected - ${error.error}`);
      }
      
    } catch (error) {
      console.log(`✅ ${test.desc}: Correctly rejected - ${error.message}`);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting GPS Location Integration Tests\n');
  
  const token = await loginAsCitizen();
  if (!token) {
    console.log('❌ Failed to login. Cannot proceed with tests.');
    return;
  }
  
  console.log('✅ Successfully logged in as citizen\n');
  
  await createTestComplaints(token);
  await testNearbyComplaints(token);
  await testLocationValidation(token);
  
  console.log('\n🎉 GPS Location Integration Tests Completed!');
}

// Run the tests
runTests().catch(console.error);
