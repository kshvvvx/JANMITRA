// MongoDB initialization script for JANMITRA
// Creates initial database and collections

db = db.getSiblingDB('janmitra');

// Create collections
db.createCollection('complaints');
db.createCollection('staff');
db.createCollection('users');

// Insert initial staff data
db.staff.insertMany([
  {
    staff_id: 'staff-001',
    name: 'Ramesh Kumar',
    dept: 'sanitation',
    wards: [1, 2],
    created_at: new Date(),
    is_active: true
  },
  {
    staff_id: 'staff-002',
    name: 'Anita Singh',
    dept: 'roads',
    wards: [3],
    created_at: new Date(),
    is_active: true
  },
  {
    staff_id: 'staff-003',
    name: 'Dev Verma',
    dept: 'electric',
    wards: [1],
    created_at: new Date(),
    is_active: true
  }
]);

// Create indexes for better performance
db.complaints.createIndex({ complaint_id: 1 }, { unique: true });
db.complaints.createIndex({ citizen_id: 1 });
db.complaints.createIndex({ status: 1 });
db.complaints.createIndex({ category: 1 });
db.complaints.createIndex({ created_at: -1 });
db.complaints.createIndex({ 'location.lat': 1, 'location.lng': 1 });

db.staff.createIndex({ staff_id: 1, dept: 1 }, { unique: true });
db.staff.createIndex({ dept: 1 });
db.staff.createIndex({ is_active: 1 });

print('✅ JANMITRA database initialized successfully');
print('📊 Created collections: complaints, staff, users');
print('👥 Inserted initial staff data');
print('🔍 Created database indexes');
