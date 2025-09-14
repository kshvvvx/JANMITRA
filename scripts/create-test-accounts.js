// Script to create test staff and supervisor accounts with hashed passwords
// Run this script to populate the database with sample accounts for testing

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Import models directly
const { Staff, Supervisor } = require('../backend/models');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra';

async function createTestAccounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash password function
    const hashPassword = async (password) => {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    };

    // Create test staff accounts
    const staffAccounts = [
      {
        staff_id: 'STAFF001',
        password: await hashPassword('password123'),
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@janmitra.gov.in',
        department: 'Public Works',
        role: 'Field Officer',
        phone: '9876543210',
        assigned_area: {
          type: 'Polygon',
          coordinates: [[
            [77.5946, 12.9716], // Bangalore coordinates
            [77.6046, 12.9716],
            [77.6046, 12.9816],
            [77.5946, 12.9816],
            [77.5946, 12.9716]
          ]]
        },
        active: true
      },
      {
        staff_id: 'STAFF002',
        password: await hashPassword('password123'),
        name: 'Priya Sharma',
        email: 'priya.sharma@janmitra.gov.in',
        department: 'Sanitation',
        role: 'Inspector',
        phone: '9876543211',
        assigned_area: {
          type: 'Polygon',
          coordinates: [[
            [77.6046, 12.9716],
            [77.6146, 12.9716],
            [77.6146, 12.9816],
            [77.6046, 12.9816],
            [77.6046, 12.9716]
          ]]
        },
        active: true
      },
      {
        staff_id: 'STAFF003',
        password: await hashPassword('password123'),
        name: 'Amit Patel',
        email: 'amit.patel@janmitra.gov.in',
        department: 'Traffic Management',
        role: 'Traffic Officer',
        phone: '9876543212',
        assigned_area: {
          type: 'Polygon',
          coordinates: [[
            [77.5846, 12.9616],
            [77.5946, 12.9616],
            [77.5946, 12.9716],
            [77.5846, 12.9716],
            [77.5846, 12.9616]
          ]]
        },
        active: true
      }
    ];

    // Create test supervisor accounts
    const supervisorAccounts = [
      {
        supervisor_id: 'SUP001',
        password: await hashPassword('supervisor123'),
        name: 'Dr. Sunita Reddy',
        email: 'sunita.reddy@janmitra.gov.in',
        departments: ['Public Works', 'Sanitation'],
        role: 'District Supervisor',
        phone: '9876543220',
        assigned_districts: ['Bangalore Urban', 'Bangalore Rural'],
        active: true,
        permissions: ['view_all_complaints', 'assign_staff', 'approve_resolutions', 'generate_reports']
      },
      {
        supervisor_id: 'SUP002',
        password: await hashPassword('supervisor123'),
        name: 'Vikram Singh',
        email: 'vikram.singh@janmitra.gov.in',
        departments: ['Traffic Management', 'Public Safety'],
        role: 'Regional Supervisor',
        phone: '9876543221',
        assigned_districts: ['Bangalore Central'],
        active: true,
        permissions: ['view_all_complaints', 'assign_staff', 'approve_resolutions', 'generate_reports']
      }
    ];

    // Insert staff accounts
    console.log('Creating staff accounts...');
    for (const staffData of staffAccounts) {
      const existingStaff = await Staff.findOne({ staff_id: staffData.staff_id });
      if (!existingStaff) {
        const staff = new Staff(staffData);
        await staff.save();
        console.log(`Created staff account: ${staffData.staff_id} - ${staffData.name}`);
      } else {
        console.log(`Staff account already exists: ${staffData.staff_id}`);
      }
    }

    // Insert supervisor accounts
    console.log('Creating supervisor accounts...');
    for (const supervisorData of supervisorAccounts) {
      const existingSupervisor = await Supervisor.findOne({ supervisor_id: supervisorData.supervisor_id });
      if (!existingSupervisor) {
        const supervisor = new Supervisor(supervisorData);
        await supervisor.save();
        console.log(`Created supervisor account: ${supervisorData.supervisor_id} - ${supervisorData.name}`);
      } else {
        console.log(`Supervisor account already exists: ${supervisorData.supervisor_id}`);
      }
    }

    console.log('\n=== Test Accounts Created Successfully ===');
    console.log('\nStaff Login Credentials:');
    console.log('STAFF001 / password123 (Rajesh Kumar - Public Works)');
    console.log('STAFF002 / password123 (Priya Sharma - Sanitation)');
    console.log('STAFF003 / password123 (Amit Patel - Traffic Management)');
    
    console.log('\nSupervisor Login Credentials:');
    console.log('SUP001 / supervisor123 (Dr. Sunita Reddy - District Supervisor)');
    console.log('SUP002 / supervisor123 (Vikram Singh - Regional Supervisor)');

  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createTestAccounts();
}

module.exports = { createTestAccounts };
