// backend/store/staffStore.js
const staff = [
  { staff_id: 'staff-001', name: 'Ramesh Kumar', dept: 'sanitation', wards: [1,2] },
  { staff_id: 'staff-002', name: 'Anita Singh', dept: 'roads', wards: [3] },
  { staff_id: 'staff-003', name: 'Dev Verma', dept: 'electric', wards: [1] }
];

function findStaff(dept, staff_id) {
  return staff.find(s => s.staff_id === staff_id && s.dept === dept);
}

module.exports = {
  staff,
  findStaff
};
