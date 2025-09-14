// Simple test using http module instead of fetch
const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData, ok: res.statusCode < 400 });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, ok: res.statusCode < 400 });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testBackend() {
  console.log('🧪 Testing JANMITRA Backend...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await makeRequest('GET', '/api/health');
    if (health.ok) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed:', health.status);
      return;
    }

    // Test 2: Staff login
    console.log('\n2. Testing staff login...');
    const login = await makeRequest('POST', '/api/staff/login', {
      dept: 'sanitation',
      staff_id: 'staff-001'
    });
    
    if (login.ok) {
      console.log('✅ Staff login successful');
      console.log('   Staff:', login.data.staff.name);
      const token = login.data.token;
      
      // Test 3: Create complaint
      console.log('\n3. Testing complaint creation...');
      const complaint = await makeRequest('POST', '/api/complaints', {
        citizen_id: 'user-123',
        description: 'Test complaint',
        location: { lat: 28.7041, lng: 77.1025, address: 'Test Location' },
        media: []
      });
      
      if (complaint.ok) {
        console.log('✅ Complaint created:', complaint.data.complaint_id);
        const complaintId = complaint.data.complaint_id;
        
        // Test 4: Staff get complaints
        console.log('\n4. Testing staff complaints endpoint...');
        const staffComplaints = await makeRequest('GET', '/api/staff/complaints', null, {
          'Authorization': `Bearer ${token}`
        });
        
        if (staffComplaints.ok) {
          console.log('✅ Staff complaints retrieved:', staffComplaints.data.count, 'complaints');
          
          // Test 5: Update complaint
          console.log('\n5. Testing complaint update...');
          const update = await makeRequest('POST', `/api/staff/complaints/${complaintId}/update`, {
            status: 'resolved',
            comment: 'Test resolution',
            media: [],
            expected_resolution_date: '2025-09-20'
          }, {
            'Authorization': `Bearer ${token}`
          });
          
          if (update.ok) {
            console.log('✅ Complaint updated successfully');
            
            // Test 6: Confirm resolution
            console.log('\n6. Testing resolution confirmation...');
            const confirm = await makeRequest('POST', `/api/complaints/${complaintId}/confirm_resolution`, {
              citizen_id: 'user-123'
            });
            
            if (confirm.ok) {
              console.log('✅ Resolution confirmed');
              console.log('\n🎉 All tests passed! Your backend is working correctly.');
            } else {
              console.log('❌ Resolution confirmation failed:', confirm.status, confirm.data);
            }
          } else {
            console.log('❌ Complaint update failed:', update.status, update.data);
          }
        } else {
          console.log('❌ Staff complaints failed:', staffComplaints.status, staffComplaints.data);
        }
      } else {
        console.log('❌ Complaint creation failed:', complaint.status, complaint.data);
      }
    } else {
      console.log('❌ Staff login failed:', login.status, login.data);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

testBackend();
