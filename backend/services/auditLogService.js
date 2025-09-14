const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');

class AuditLogService {
  /**
   * Log an action to the audit log
   * @param {Object} params - Log parameters
   * @param {string} params.userId - ID of the user performing the action
   * @param {string} params.userType - Type of user (citizen, staff, supervisor, guest)
   * @param {string} params.action - The action being performed
   * @param {string} params.resourceType - Type of resource being acted upon
   * @param {string} [params.resourceId] - ID of the resource
   * @param {Object} [params.details] - Additional details about the action
   * @param {string} [params.ipAddress] - IP address of the requester
   * @param {string} [params.userAgent] - User agent string
   * @param {string} [params.deviceId] - Device ID
   * @param {string} [params.departmentId] - Department ID (for staff/supervisor)
   * @param {boolean} [params.success=true] - Whether the action was successful
   * @param {string} [params.errorMessage] - Error message if action failed
   * @param {string} [params.sessionId] - Session ID
   * @returns {Promise<Object>} The created audit log entry
   */
  static async log({
    userId,
    userType,
    action,
    resourceType,
    resourceId = null,
    details = {},
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    departmentId = null,
    success = true,
    errorMessage = null,
    sessionId = null
  }) {
    try {
      return await AuditLog.logAction({
        userId,
        userType,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent,
        deviceId,
        departmentId,
        success,
        errorMessage,
        sessionId: sessionId || uuidv4()
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      return null;
    }
  }

  /**
   * Get paginated audit logs with filtering
   * @param {Object} options - Query options
   * @param {string} [options.userId] - Filter by user ID
   * @param {string} [options.userType] - Filter by user type
   * @param {string} [options.action] - Filter by action
   * @param {string} [options.resourceType] - Filter by resource type
   * @param {string} [options.resourceId] - Filter by resource ID
   * @param {string} [options.departmentId] - Filter by department ID
   * @param {boolean} [options.success] - Filter by success status
   * @param {Date} [options.startDate] - Start date for filtering
   * @param {Date} [options.endDate] - End date for filtering
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {string} [options.sortBy='-timestamp'] - Sort field and direction
   * @returns {Promise<Object>} Paginated audit logs
   */
  static async getLogs({
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
  } = {}) {
    try {
      const query = {};
      
      if (userId) query.user_id = userId;
      if (userType) query.user_type = userType;
      if (action) query.action = action;
      if (resourceType) query.resource_type = resourceType;
      if (resourceId) query.resource_id = resourceId;
      if (departmentId) query.department_id = departmentId;
      if (typeof success === 'boolean') query.success = success;
      
      // Date range filtering
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort(sortBy)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return {
        data: logs,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get statistics about system usage
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} System statistics
   */
  static async getSystemStats(startDate, endDate) {
    try {
      return await AuditLog.getSystemStats(startDate, endDate);
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw error;
    }
  }

  /**
   * Get activity for a specific complaint
   * @param {string} complaintId - ID of the complaint
   * @returns {Promise<Array>} List of audit log entries
   */
  static async getComplaintHistory(complaintId) {
    try {
      return await AuditLog.getComplaintHistory(complaintId);
    } catch (error) {
      console.error('Error getting complaint history:', error);
      throw error;
    }
  }

  /**
   * Get recent activity for a user
   * @param {string} userId - ID of the user
   * @param {number} limit - Maximum number of entries to return
   * @returns {Promise<Array>} List of audit log entries
   */
  static async getUserActivity(userId, limit = 50) {
    try {
      return await AuditLog.getUserActivity(userId, limit);
    } catch (error) {
      console.error('Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * Get recent activity for a department
   * @param {string} departmentId - ID of the department
   * @param {number} limit - Maximum number of entries to return
   * @returns {Promise<Array>} List of audit log entries
   */
  static async getDepartmentActivity(departmentId, limit = 100) {
    try {
      return await AuditLog.getDepartmentActivity(departmentId, limit);
    } catch (error) {
      console.error('Error getting department activity:', error);
      throw error;
    }
  }

  /**
   * Middleware to log HTTP requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  static async logHttpRequest(req, res, next) {
    const start = Date.now();
    const originalSend = res.send;
    const requestId = req.headers['x-request-id'] || uuidv4();

    // Buffer to capture response body
    let responseBody;
    res.send = function(body) {
      responseBody = body;
      return originalSend.apply(res, arguments);
    };

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const duration = Date.now() - start;
        const userId = req.user?._id?.toString() || 'anonymous';
        const userType = req.user?.role || 'guest';
        const departmentId = req.user?.departmentId;
        
        // Skip logging for health checks and static files
        const skipPaths = ['/health', '/favicon.ico', '/static'];
        if (skipPaths.some(path => req.path.startsWith(path))) {
          return;
        }

        // Determine resource type from URL
        let resourceType = 'system';
        const pathParts = req.path.split('/');
        if (pathParts.length > 2) {
          resourceType = pathParts[2]; // e.g., /api/complaints -> complaints
        }

        // Prepare log data
        const logData = {
          userId,
          userType,
          action: `${req.method.toUpperCase()}_${resourceType.toUpperCase()}`,
          resourceType,
          resourceId: req.params.id,
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            params: req.params,
            query: req.query,
            ...(res.statusCode >= 400 ? { error: responseBody } : {})
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          departmentId,
          success: res.statusCode < 400,
          sessionId: req.sessionID || requestId
        };

        // Log the action
        await this.log(logData);
      } catch (error) {
        console.error('Error in audit log middleware:', error);
      }
    });

    next();
  }
}

module.exports = AuditLogService;
