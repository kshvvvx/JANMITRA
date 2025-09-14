// Test complaint creation with proper authentication
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testComplaintCreation() {
  console.log('📝 Testing Complaint Creation\n');
  
  try {
    // 1. Get authentication token
    const otpResponse = await fetch(`${API_BASE}/auth/citizen/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' })
    });
    
    const otpResult = await otpResponse.json();
    
    const verifyResponse = await fetch(`${API_BASE}/auth/citizen/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: '9876543210', 
        otp: otpResult.otp 
      })
    });
    
    const verifyResult = await verifyResponse.json();
    const token = verifyResult.token;
    
    console.log('✅ Authentication successful');
    
    // 2. Create complaint
    console.log('\n2. Creating complaint...');
    const complaintResponse = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Test complaint for system testing',
        location: {
          lat: 28.7041,
          lng: 77.1025,
          address: 'Test Location, New Delhi'
        }
      })
    });
    
    if (!complaintResponse.ok) {
      const errorText = await complaintResponse.text();
      throw new Error(`Complaint creation failed: ${complaintResponse.status} - ${errorText}`);
    }
    
    const complaintResult = await complaintResponse.json();
    console.log('✅ Complaint created successfully:', complaintResult.complaint_id);
    
    // 3. Verify complaint exists
    console.log('\n3. Verifying complaint...');
    const getResponse = await fetch(`${API_BASE}/complaints/${complaintResult.complaint_id}`);
    
    if (getResponse.ok) {
      const complaint = await getResponse.json();
      console.log('✅ Complaint verified:', {
        id: complaint.complaint_id,
        status: complaint.status,
        description: complaint.description.substring(0, 50) + '...'
      });
      return complaintResult.complaint_id;
    } else {
      console.log('❌ Could not verify complaint');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

// Run test
testComplaintCreation().then(complaintId => {
  if (complaintId) {
    console.log(`\n✅ Complaint system working! ID: ${complaintId}`);
  }
});
