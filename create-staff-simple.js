// Simple script to create staff accounts directly
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janmitra';

const staffSchema = new mongoose.Schema({
  staff_id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { 
    type: String, 
    required: true,
    enum: ['roads', 'water', 'electricity', 'sanitation', 'parks', 'general']
  },
  role: { 
    type: String, 
    required: true,
    enum: ['staff', 'senior_staff', 'department_head'],
    default: 'staff'
  },
  phone: String,
  assigned_area: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const supervisorSchema = new mongoose.Schema({
  supervisor_id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  departments: [String],
  role: String,
  phone: String,
  assigned_districts: [String],
  active: { type: Boolean, default: true },
  permissions: [String]
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);
const Supervisor = mongoose.model('Supervisor', supervisorSchema);

async function createStaffAccounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash passwords
    const staffPassword = await bcrypt.hash('password123', 10);
    const supPassword = await bcrypt.hash('supervisor123', 10);

    // Create staff accounts
    const staffAccounts = [
      {
        staff_id: 'STAFF001',
        password: staffPassword,
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@janmitra.gov.in',
        department: 'roads',
        role: 'staff',
        phone: '9876543210',
        assigned_area: 'Bangalore Urban North',
        active: true
      },
      {
        staff_id: 'STAFF002',
        password: staffPassword,
        name: 'Priya Sharma',
        email: 'priya.sharma@janmitra.gov.in',
        department: 'sanitation',
        role: 'staff',
        phone: '9876543211',
        assigned_area: 'Bangalore Urban South',
        active: true
      },
      {
        staff_id: 'STAFF003',
        password: staffPassword,
        name: 'Amit Patel',
        email: 'amit.patel@janmitra.gov.in',
        department: 'general',
        role: 'staff',
        phone: '9876543212',
        assigned_area: 'Bangalore Urban Central',
        active: true
      }
    ];

    // Create supervisor accounts
    const supervisorAccounts = [
      {
        supervisor_id: 'SUP001',
        password: supPassword,
        name: 'Dr. Sunita Reddy',
        email: 'sunita.reddy@janmitra.gov.in',
        departments: ['roads', 'sanitation'],
        role: 'District Supervisor',
        phone: '9876543220',
        assigned_districts: ['Bangalore Urban'],
        active: true,
        permissions: ['view_all_complaints', 'assign_staff', 'approve_resolutions']
      },
      {
        supervisor_id: 'SUP002',
        password: supPassword,
        name: 'Vikram Singh',
        email: 'vikram.singh@janmitra.gov.in',
        departments: ['general', 'parks'],
        role: 'Regional Supervisor',
        phone: '9876543221',
        assigned_districts: ['Bangalore Central'],
        active: true,
        permissions: ['view_all_complaints', 'assign_staff', 'approve_resolutions']
      }
    ];

    // Clear existing accounts
    await Staff.deleteMany({});
    await Supervisor.deleteMany({});
    console.log('Cleared existing accounts');

    // Insert new accounts
    await Staff.insertMany(staffAccounts);
    console.log('Created staff accounts:', staffAccounts.map(s => s.staff_id));

    await Supervisor.insertMany(supervisorAccounts);
    console.log('Created supervisor accounts:', supervisorAccounts.map(s => s.supervisor_id));

    console.log('\n=== Test Accounts Created Successfully ===');
    console.log('Staff: STAFF001, STAFF002, STAFF003 / password123');
    console.log('Supervisors: SUP001, SUP002 / supervisor123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createStaffAccounts();
