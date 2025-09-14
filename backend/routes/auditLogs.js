const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auditLogController = require('../controllers/auditLogController');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// Apply auth middleware to all routes
router.use(auth);

// Apply role-based access control (only supervisors and admins can access audit logs)
router.use(authorize(['supervisor', 'admin']));

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Supervisor/Admin only)
 */
router.get(
  '/',
  [
    check('page').optional().isInt({ min: 1 }).toInt(),
    check('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    check('sortBy').optional().isString(),
    check('userId').optional().isString(),
    check('userType').optional().isIn(['citizen', 'staff', 'supervisor', 'guest']),
    check('action').optional().isString(),
    check('resourceType').optional().isString(),
    check('resourceId').optional().isString(),
    check('departmentId').optional().isString(),
    check('success').optional().isIn(['true', 'false']),
    check('startDate').optional().isISO8601(),
    check('endDate').optional().isISO8601()
  ],
  auditLogController.getAuditLogs
);

/**
 * @route   GET /api/audit-logs/actions
 * @desc    Get list of all available audit log actions
 * @access  Private (Supervisor/Admin only)
 */
router.get('/actions', auditLogController.getAuditLogActions);

/**
 * @route   GET /api/audit-logs/entity-types
 * @desc    Get list of all entity types in audit logs
 * @access  Private (Supervisor/Admin only)
 */
router.get('/entity-types', auditLogController.getEntityTypes);

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Get a single audit log entry by ID
 * @access  Private (Supervisor/Admin only)
 */
router.get('/:id', auditLogController.getAuditLogById);

/**
 * @route   GET /api/audit-logs/export
 * @desc    Export audit logs as CSV or JSON
 * @access  Private (Supervisor/Admin only)
 */
router.get(
  '/export',
  [
    check('format').optional().isIn(['json', 'csv']),
    check('userId').optional().isString(),
    check('userType').optional().isIn(['citizen', 'staff', 'supervisor', 'guest']),
    check('action').optional().isString(),
    check('resourceType').optional().isString(),
    check('resourceId').optional().isString(),
    check('departmentId').optional().isString(),
    check('success').optional().isIn(['true', 'false']),
    check('startDate').optional().isISO8601(),
    check('endDate').optional().isISO8601()
  ],
  auditLogController.exportAuditLogs
);

module.exports = router;
