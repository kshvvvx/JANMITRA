// JANMITRA Backend Integration Test
// Tests the complete flow: staff login -> complaint creation -> staff management -> citizen confirmation

const BASE_URL = 'http://localhost:5000';

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, body = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      ok: response.ok
    };
  } catch (error) {
    console.error(`Request failed: ${method} ${endpoint}`, error.message);
    throw error;
  }
}

// Test helper functions
function logStep(step, description) {
  console.log(`\n🔄 Step ${step}: ${description}`);
}

function logSuccess(message, data = null) {
  console.log(`✅ ${message}`);
  if (data) {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
}

function logError(message, error = null) {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(`   Error:`, error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting JANMITRA Backend Integration Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  
  let staffToken = null;
  let complaintId = null;
  
  try {
    // Step 1: Staff Login
    logStep(1, 'Staff Login');
    const loginResponse = await makeRequest('POST', '/api/staff/login', {
      dept: 'sanitation',
      staff_id: 'staff-001'
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
    }
    
    staffToken = loginResponse.data.token;
    logSuccess('Staff login successful', {
      staff: loginResponse.data.staff,
      tokenLength: staffToken.length
    });
    
    // Step 2: Citizen Creates Complaint
    logStep(2, 'Citizen Creates Complaint');
    const complaintData = {
      citizen_id: 'user-123',
      description: 'Streetlight not working near market',
      location: { lat: 28.7041, lng: 77.1025, address: 'Sector X' },
      media: []
    };
    
    const complaintResponse = await makeRequest('POST', '/api/complaints', complaintData);
    
    if (!complaintResponse.ok) {
      throw new Error(`Complaint creation failed: ${complaintResponse.status} - ${JSON.stringify(complaintResponse.data)}`);
    }
    
    complaintId = complaintResponse.data.complaint_id;
    logSuccess('Complaint created successfully', {
      complaint_id: complaintId,
      status: complaintResponse.data.status
    });
    
    // Step 3: Staff Fetches Prioritized Complaints
    logStep(3, 'Staff Fetches Prioritized Complaints');
    const complaintsResponse = await makeRequest('GET', '/api/staff/complaints?sort=priority', null, {
      'Authorization': `Bearer ${staffToken}`
    });
    
    if (!complaintsResponse.ok) {
      throw new Error(`Fetch complaints failed: ${complaintsResponse.status} - ${JSON.stringify(complaintsResponse.data)}`);
    }
    
    logSuccess('Complaints fetched successfully', {
      count: complaintsResponse.data.count,
      foundOurComplaint: complaintsResponse.data.complaints.some(c => c.complaint_id === complaintId)
    });
    
    // Step 4: Staff Updates Complaint
    logStep(4, 'Staff Updates Complaint Status');
    const updateData = {
      status: 'resolved',
      comment: 'Fixed by crew',
      media: [],
      expected_resolution_date: '2025-09-20'
    };
    
    const updateResponse = await makeRequest('POST', `/api/staff/complaints/${complaintId}/update`, updateData, {
      'Authorization': `Bearer ${staffToken}`
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Complaint update failed: ${updateResponse.status} - ${JSON.stringify(updateResponse.data)}`);
    }
    
    logSuccess('Complaint updated successfully', {
      status: updateResponse.data.complaint.status,
      resolved_by: updateResponse.data.complaint.resolved_by,
      actions_count: updateResponse.data.complaint.actions.length
    });
    
    // Step 5: Citizen Confirms Resolution
    logStep(5, 'Citizen Confirms Resolution');
    const confirmResponse = await makeRequest('POST', `/api/complaints/${complaintId}/confirm_resolution`, {
      citizen_id: 'user-123'
    });
    
    if (!confirmResponse.ok) {
      throw new Error(`Resolution confirmation failed: ${confirmResponse.status} - ${JSON.stringify(confirmResponse.data)}`);
    }
    
    logSuccess('Resolution confirmed successfully', {
      confirmations: confirmResponse.data.confirmations,
      status: confirmResponse.data.status
    });
    
    // Step 6: Verify Final State
    logStep(6, 'Verify Final Complaint State');
    const finalComplaintResponse = await makeRequest('GET', `/api/complaints/${complaintId}`);
    
    if (!finalComplaintResponse.ok) {
      throw new Error(`Final verification failed: ${finalComplaintResponse.status} - ${JSON.stringify(finalComplaintResponse.data)}`);
    }
    
    const finalComplaint = finalComplaintResponse.data;
    logSuccess('Final complaint state verified', {
      status: finalComplaint.status,
      confirmations: finalComplaint.confirmations.length,
      actions: finalComplaint.actions.length,
      resolved_at: finalComplaint.resolved_at,
      closed_at: finalComplaint.closed_at
    });
    
    // Step 7: Test Staff History
    logStep(7, 'Test Staff History Endpoint');
    const historyResponse = await makeRequest('GET', '/api/staff/complaints/history', null, {
      'Authorization': `Bearer ${staffToken}`
    });
    
    if (!historyResponse.ok) {
      throw new Error(`History fetch failed: ${historyResponse.status} - ${JSON.stringify(historyResponse.data)}`);
    }
    
    logSuccess('Staff history fetched successfully', {
      count: historyResponse.data.count,
      foundOurComplaint: historyResponse.data.complaints.some(c => c.complaint_id === complaintId)
    });
    
    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Staff authentication working`);
    console.log(`   ✅ Complaint creation working`);
    console.log(`   ✅ Staff complaint management working`);
    console.log(`   ✅ Resolution confirmation working`);
    console.log(`   ✅ Complaint lifecycle complete`);
    console.log(`   ✅ Staff history tracking working`);
    
  } catch (error) {
    logError('Test failed', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure your backend is running on http://localhost:5000');
    console.log('   2. Check that all required dependencies are installed');
    console.log('   3. Verify the staff store has the test staff member (staff-001)');
    console.log('   4. Check server logs for any errors');
    process.exit(1);
  }
}

// Additional test: Test error cases
async function runErrorTests() {
  console.log('\n🧪 Running Error Case Tests...');
  
  try {
    // Test invalid staff login
    logStep('E1', 'Test Invalid Staff Login');
    const invalidLogin = await makeRequest('POST', '/api/staff/login', {
      dept: 'invalid',
      staff_id: 'invalid'
    });
    
    if (invalidLogin.status === 401) {
      logSuccess('Invalid login correctly rejected');
    } else {
      logError('Invalid login should return 401', `Got ${invalidLogin.status}`);
    }
    
    // Test unauthorized staff request
    logStep('E2', 'Test Unauthorized Staff Request');
    const unauthorized = await makeRequest('GET', '/api/staff/complaints');
    
    if (unauthorized.status === 401) {
      logSuccess('Unauthorized request correctly rejected');
    } else {
      logError('Unauthorized request should return 401', `Got ${unauthorized.status}`);
    }
    
    // Test invalid complaint ID
    logStep('E3', 'Test Invalid Complaint ID');
    const invalidComplaint = await makeRequest('GET', '/api/complaints/invalid-id');
    
    if (invalidComplaint.status === 404) {
      logSuccess('Invalid complaint ID correctly rejected');
    } else {
      logError('Invalid complaint ID should return 404', `Got ${invalidComplaint.status}`);
    }
    
    console.log('\n✅ Error case tests completed');
    
  } catch (error) {
    logError('Error case test failed', error.message);
  }
}

// Run all tests
async function main() {
  try {
    await runTests();
    await runErrorTests();
    console.log('\n🏁 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await makeRequest('GET', '/api/health');
    if (response.ok) {
      console.log('✅ Backend is running and healthy');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend is not running or not accessible');
    console.log('   Please start your backend with: npm start');
    return false;
  }
}

// Start the tests
if (require.main === module) {
  checkBackend().then(isRunning => {
    if (isRunning) {
      main();
    } else {
      process.exit(1);
    }
  });
}

module.exports = { runTests, runErrorTests };
