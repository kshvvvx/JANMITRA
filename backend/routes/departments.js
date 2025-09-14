const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireStaff, requireSupervisor } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Department login endpoint - uses unique department ID instead of individual staff accounts
router.post('/login', async (req, res) => {
  try {
    const { department_id, staff_id, device_id } = req.body;

    if (!department_id || !staff_id || !device_id) {
      return res.status(400).json({ 
        error: 'Department ID, staff ID, and device ID are required' 
      });
    }

    // Find department by unique_id
    const department = await Department.findOne({ 
      unique_id: department_id,
      active: true 
    });

    if (!department) {
      await AuditLog.logAction({
        userId: staff_id,
        userType: 'staff',
        action: 'login_failed',
        resourceType: 'department',
        resourceId: department_id,
        details: { reason: 'Department not found' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: device_id,
        success: false,
        errorMessage: 'Department not found'
      });

      return res.status(401).json({ error: 'Invalid department credentials' });
    }

    // Check if phone number is banned
    if (department.isPhoneBanned(staff_id)) {
      await AuditLog.logAction({
        userId: staff_id,
        userType: 'staff',
        action: 'login_blocked',
        resourceType: 'department',
        resourceId: department_id,
        details: { reason: 'Phone number banned' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: device_id,
        departmentId: department.unique_id,
        success: false,
        errorMessage: 'Phone number banned'
      });

      return res.status(403).json({ error: 'Access denied - contact supervisor' });
    }

    // Check device login restrictions
    const primaryDevice = department.getPrimaryDevice();
    const isNewDevice = !department.logged_in_devices.some(d => d.device_id === device_id);

    if (primaryDevice && isNewDevice) {
      // Secondary device login requires supervisor approval
      return res.status(202).json({
        message: 'Secondary device login requires supervisor approval',
        requires_approval: true,
        department_id: department.unique_id,
        primary_device: primaryDevice.device_id,
        supervisor_id: department.supervisor_id
      });
    }

    // Login successful - register device
    const isPrimary = !primaryDevice;
    await department.loginDevice(device_id, staff_id, isPrimary);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: staff_id,
        departmentId: department.unique_id,
        role: 'staff',
        deviceId: device_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    await AuditLog.logAction({
      userId: staff_id,
      userType: 'staff',
      action: 'login_success',
      resourceType: 'department',
      resourceId: department_id,
      details: { 
        device_type: isPrimary ? 'primary' : 'secondary',
        department_name: department.name
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceId: device_id,
      departmentId: department.unique_id
    });

    res.json({
      token,
      department: {
        id: department.unique_id,
        name: department.name,
        category: department.category,
        location: {
          state: department.state,
          city: department.city,
          area: department.area
        }
      },
      staff_id,
      device_type: isPrimary ? 'primary' : 'secondary',
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Department login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve secondary device login (supervisor only)
router.post('/approve-device', requireSupervisor, async (req, res) => {
  try {
    const { department_id, device_id, staff_id } = req.body;
    const supervisor_id = req.user.userId;

    const department = await Department.findOne({ unique_id: department_id });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (department.supervisor_id !== supervisor_id) {
      return res.status(403).json({ error: 'Not authorized for this department' });
    }

    // Approve and login device
    await department.loginDevice(device_id, staff_id, false, supervisor_id);

    // Generate JWT token for approved device
    const token = jwt.sign(
      { 
        userId: staff_id,
        departmentId: department.unique_id,
        role: 'staff',
        deviceId: device_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log approval
    await AuditLog.logAction({
      userId: supervisor_id,
      userType: 'supervisor',
      action: 'device_approved',
      resourceType: 'department',
      resourceId: department_id,
      details: { 
        approved_staff_id: staff_id,
        approved_device_id: device_id
      },
      departmentId: department.unique_id
    });

    res.json({
      token,
      message: 'Secondary device approved and logged in',
      department: {
        id: department.unique_id,
        name: department.name
      }
    });

  } catch (error) {
    console.error('Device approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ban phone number (supervisor only)
router.post('/:id/ban-phone', requireSupervisor, async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, reason } = req.body;
    const supervisor_id = req.user.userId;

    const department = await Department.findOne({ unique_id: id });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (department.supervisor_id !== supervisor_id) {
      return res.status(403).json({ error: 'Not authorized for this department' });
    }

    await department.banPhoneNumber(phone, reason, supervisor_id);

    // Log ban action
    await AuditLog.logAction({
      userId: supervisor_id,
      userType: 'supervisor',
      action: 'phone_banned',
      resourceType: 'department',
      resourceId: id,
      details: { 
        banned_phone: phone,
        reason: reason
      },
      departmentId: department.unique_id
    });

    res.json({
      message: 'Phone number banned successfully',
      banned_phone: phone,
      reason: reason
    });

  } catch (error) {
    console.error('Phone ban error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department performance metrics
router.get('/:id/metrics', requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findOne({ unique_id: id });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if user has access to this department
    if (req.user.departmentId !== id && req.user.role !== 'supervisor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      department_id: department.unique_id,
      name: department.name,
      metrics: department.performance_metrics,
      active_devices: department.logged_in_devices.length,
      banned_numbers: department.banned_numbers.length
    });

  } catch (error) {
    console.error('Metrics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout device
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { departmentId, deviceId } = req.user;

    const department = await Department.findOne({ unique_id: departmentId });
    if (department) {
      await department.logoutDevice(deviceId);
    }

    // Log logout
    await AuditLog.logAction({
      userId: req.user.userId,
      userType: 'staff',
      action: 'logout',
      resourceType: 'department',
      resourceId: departmentId,
      deviceId: deviceId,
      departmentId: departmentId
    });

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
