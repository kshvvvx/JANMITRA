// backend/utils/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.STAFF_JWT_SECRET || 'janmitra-secret';

function generateStaffToken(staff) {
  const payload = { staff_id: staff.staff_id, dept: staff.dept, name: staff.name };
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

function requireStaff(req, res, next) {
  const auth = req.header('authorization');
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.replace('Bearer ', '').trim();
  try {
    const payload = jwt.verify(token, SECRET);
    req.staff = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { generateStaffToken, requireStaff };
