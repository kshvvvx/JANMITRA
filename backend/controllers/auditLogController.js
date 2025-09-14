const { validationResult } = require('express-validator');
const AuditLogService = require('../services/auditLogService');

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Supervisor/Admin only)
 */
exports.getAuditLogs = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      userId,
      userType,
      action,
      resourceType,
      resourceId,
      departmentId,
      success,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = '-timestamp'
    } = req.query;

    // Get logs
    const result = await AuditLogService.getLogs({
      userId,
      userType,
      action,
      resourceType,
      resourceId,
      departmentId,
      success: success ? success === 'true' : undefined,
      startDate,
      endDate,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100), // Cap at 100 items per page
      sortBy
    });

    // Log the access
    await AuditLogService.log({
      userId: req.user._id,
      userType: req.user.role,
      action: 'AUDIT_LOG_VIEW',
      resourceType: 'audit_log',
      details: {
        filters: {
          userId,
          userType,
          action,
          resourceType,
          resourceId,
          departmentId,
          success,
          startDate,
          endDate
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      departmentId: req.user.departmentId
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ message: 'Error retrieving audit logs' });
  }
};

/**
 * @route   GET /api/audit-logs/actions
 * @desc    Get list of all available audit log actions
 * @access  Private (Supervisor/Admin only)
 */
exports.getAuditLogActions = async (req, res) => {
  try {
    const actions = [
      // Authentication actions
      'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_VERIFY_OTP',
      
      // Complaint actions
      'COMPLAINT_CREATE', 'COMPLAINT_UPDATE', 'COMPLAINT_DELETE', 
      'COMPLAINT_STATUS_CHANGE', 'COMPLAINT_UPVOTE', 'COMPLAINT_CONFIRM',
      'COMPLAINT_ESCALATE', 'COMPLAINT_ASSIGN', 'COMPLAINT_COMMENT',
      
      // Media actions
      'MEDIA_UPLOAD', 'MEDIA_DELETE', 'MEDIA_UPDATE',
      
      // Department actions
      'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE', 'DEPARTMENT_DELETE',
      
      // User management
      'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_PASSWORD_CHANGE',
      
      // System actions
      'SETTINGS_UPDATE', 'AUDIT_LOG_VIEW', 'AUDIT_LOG_EXPORT',
      'SYSTEM_BACKUP', 'SYSTEM_RESTORE', 'SYSTEM_MAINTENANCE'
    ];

    res.json({ actions });
  } catch (error) {
    console.error('Error getting audit log actions:', error);
    res.status(500).json({ message: 'Error retrieving audit log actions' });
  }
};

/**
 * @route   GET /api/audit-logs/entity-types
 * @desc    Get list of all entity types in audit logs
 * @access  Private (Supervisor/Admin only)
 */
exports.getEntityTypes = async (req, res) => {
  try {
    const entityTypes = [
      'user', 'complaint', 'department', 'media', 'system', 'audit_log',
      'notification', 'settings', 'backup', 'maintenance'
    ];
    res.json({ entityTypes });
  } catch (error) {
    console.error('Error getting entity types:', error);
    res.status(500).json({ message: 'Error retrieving entity types' });
  }
};

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Get a single audit log entry by ID
 * @access  Private (Supervisor/Admin only)
 */
exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLogService.getLogById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    // Log the access to this specific log
    await AuditLogService.log({
      userId: req.user._id,
      userType: req.user.role,
      action: 'AUDIT_LOG_VIEW_DETAIL',
      resourceType: 'audit_log',
      resourceId: log._id,
      details: {
        logId: log._id
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      departmentId: req.user.departmentId
    });

    res.json(log);
  } catch (error) {
    console.error('Error getting audit log by ID:', error);
    res.status(500).json({ message: 'Error retrieving audit log' });
  }
};

/**
 * @route   GET /api/audit-logs/export
 * @desc    Export audit logs as CSV or JSON
 * @access  Private (Supervisor/Admin only)
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const { format = 'json', ...filters } = req.query;
    
    // Get all logs matching the filters (no pagination for export)
    const { data: logs } = await AuditLogService.getLogs({
      ...filters,
      limit: 10000 // Maximum number of logs to export
    });

    // Log the export action
    await AuditLogService.log({
      userId: req.user._id,
      userType: req.user.role,
      action: 'AUDIT_LOG_EXPORT',
      resourceType: 'audit_log',
      details: {
        format,
        filterCount: Object.keys(filters).length,
        logCount: logs.length
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      departmentId: req.user.departmentId
    });

    if (format.toLowerCase() === 'csv') {
      // Convert logs to CSV format
      const { Parser } = require('json2csv');
      const fields = [
        'timestamp',
        'user_id',
        'user_type',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
        'success'
      ];
      
      const json2csv = new Parser({ fields });
      const csv = json2csv.parse(logs);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('audit-logs.csv');
      return res.send(csv);
    }

    // Default to JSON format
    res.json(logs);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ message: 'Error exporting audit logs' });
  }
};
