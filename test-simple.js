const http = require('http');

// Test data
const testData = JSON.stringify({
  description: 'Simple test complaint',
  category: 'test',
  location: {
    address: '123 Test St',
    lat: 12.9716,
    lng: 77.5946
  },
  media: []
});

// Options for the request
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/complaints',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length,
    'Authorization': 'Bearer test-token' // This will be invalid, but we want to see the response
  }
};

// Make the request
const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

// Send the request body
req.write(testData);
req.end();
