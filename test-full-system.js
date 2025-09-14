#!/usr/bin/env node
/**
 * JANMITRA Full System Test
 * Tests the complete flow: Backend + AI Services + Frontend API integration
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:5001';

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
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

async function testAIServices() {
  console.log('🤖 Testing AI Services...');
  
  try {
    // Test AI health
    const health = await makeRequest(`${AI_URL}/health`);
    if (!health.ok) {
      console.log('❌ AI service not running. Start it with: cd ai-services && python app.py');
      return false;
    }
    console.log('✅ AI service is running');

    // Test categorization
    const categorize = await makeRequest(`${AI_URL}/categorize`, 'POST', {
      description: 'Large pothole on main road causing vehicle damage'
    });
    
    if (categorize.ok) {
      console.log(`✅ Categorization: ${categorize.data.category} (confidence: ${categorize.data.confidence})`);
    } else {
      console.log('❌ Categorization failed');
      return false;
    }

    // Test danger scoring
    const danger = await makeRequest(`${AI_URL}/danger-score`, 'POST', {
      description: 'Live wire hanging dangerously low',
      category: 'electric'
    });
    
    if (danger.ok) {
      console.log(`✅ Danger Score: ${danger.data.danger_score} (${danger.data.urgency_level})`);
    } else {
      console.log('❌ Danger scoring failed');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ AI service error:', error.message);
    return false;
  }
}

async function testBackendWithAI() {
  console.log('\n🔗 Testing Backend with AI Integration...');
  
  try {
    // Test complaint creation with AI
    const complaint = await makeRequest(`${BACKEND_URL}/api/complaints`, 'POST', {
      citizen_id: 'user-123',
      description: 'Large pothole on main road causing vehicle damage and traffic issues',
      location: { lat: 28.7041, lng: 77.1025, address: 'Main Road, Sector X' },
      media: []
    });
    
    if (complaint.ok) {
      console.log('✅ Complaint created with AI analysis');
      console.log(`   Category: ${complaint.data.category}`);
      console.log(`   Danger Score: ${complaint.data.dangerScore}`);
      console.log(`   Duplicates: ${complaint.data.duplicates.length}`);
      return complaint.data.complaint_id;
    } else {
      console.log('❌ Complaint creation failed:', complaint.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Backend error:', error.message);
    return null;
  }
}

async function testStaffWorkflow() {
  console.log('\n👨‍💼 Testing Staff Workflow...');
  
  try {
    // Staff login
    const login = await makeRequest(`${BACKEND_URL}/api/staff/login`, 'POST', {
      dept: 'sanitation',
      staff_id: 'staff-001'
    });
    
    if (!login.ok) {
      console.log('❌ Staff login failed');
      return;
    }
    
    console.log('✅ Staff login successful');
    const token = login.data.token;
    
    // Get staff complaints
    const complaints = await makeRequest(`${BACKEND_URL}/api/staff/complaints`, 'GET', null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (complaints.ok) {
      console.log(`✅ Retrieved ${complaints.data.count} complaints for staff`);
      
      // Update a complaint if available
      if (complaints.data.complaints.length > 0) {
        const complaintId = complaints.data.complaints[0].complaint_id;
        
        const update = await makeRequest(`${BACKEND_URL}/api/staff/complaints/${complaintId}/update`, 'POST', {
          status: 'in-progress',
          comment: 'Inspected the issue, work will begin soon',
          expected_resolution_date: '2024-01-25'
        }, {
          'Authorization': `Bearer ${token}`
        });
        
        if (update.ok) {
          console.log('✅ Complaint status updated successfully');
        } else {
          console.log('❌ Complaint update failed');
        }
      }
    } else {
      console.log('❌ Failed to get staff complaints');
    }
  } catch (error) {
    console.log('❌ Staff workflow error:', error.message);
  }
}

async function testCitizenWorkflow() {
  console.log('\n👤 Testing Citizen Workflow...');
  
  try {
    // Create a complaint
    const complaint = await makeRequest(`${BACKEND_URL}/api/complaints`, 'POST', {
      citizen_id: 'user-456',
      description: 'Garbage not collected for 3 days, creating bad smell',
      location: { lat: 28.7051, lng: 77.1035, address: 'Residential Area, Sector Y' },
      media: []
    });
    
    if (!complaint.ok) {
      console.log('❌ Citizen complaint creation failed');
      return;
    }
    
    console.log('✅ Citizen complaint created');
    const complaintId = complaint.data.complaint_id;
    
    // Upvote the complaint
    const upvote = await makeRequest(`${BACKEND_URL}/api/complaints/${complaintId}/upvote`, 'POST', {
      citizen_id: 'user-789'
    });
    
    if (upvote.ok) {
      console.log(`✅ Complaint upvoted (${upvote.data.upvotes} upvotes)`);
    } else {
      console.log('❌ Upvote failed');
    }
    
    // Get nearby complaints
    const nearby = await makeRequest(`${BACKEND_URL}/api/complaints?near=28.7041,77.1025`);
    
    if (nearby.ok) {
      console.log(`✅ Retrieved ${nearby.data.count} nearby complaints`);
    } else {
      console.log('❌ Failed to get nearby complaints');
    }
  } catch (error) {
    console.log('❌ Citizen workflow error:', error.message);
  }
}

async function runFullSystemTest() {
  console.log('🚀 JANMITRA Full System Test');
  console.log('=' * 50);
  
  // Test AI services first
  const aiWorking = await testAIServices();
  
  // Test backend
  console.log('\n🔧 Testing Backend...');
  const health = await makeRequest(`${BACKEND_URL}/api/health`);
  if (!health.ok) {
    console.log('❌ Backend not running. Start it with: cd backend && npm start');
    return;
  }
  console.log('✅ Backend is running');
  
  // Test backend with AI integration
  const complaintId = await testBackendWithAI();
  
  // Test staff workflow
  await testStaffWorkflow();
  
  // Test citizen workflow
  await testCitizenWorkflow();
  
  console.log('\n🎉 Full System Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. Start the frontend: cd frontend && npm start');
  console.log('2. Open Expo Go app on your phone');
  console.log('3. Scan the QR code to test the mobile app');
  console.log('4. Test complaint creation, viewing nearby issues, and staff login');
}

// Run the test
runFullSystemTest().catch(console.error);
