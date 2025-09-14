const AuditLogService = require('../services/auditLogService');
const { v4: uuidv4 } = require('uuid');

// List of paths that should be excluded from audit logging
const EXCLUDED_PATHS = [
  '/health',
  '/favicon.ico',
  '/static',
  '/metrics',
  '/api/audit-logs/export' // Exclude export to prevent large response logging
];

/**
 * Middleware to log HTTP requests to the audit log
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function auditLogMiddleware(req, res, next) {
  // Skip logging for excluded paths
  if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
    return next();
  }

  const start = Date.now();
  const requestId = req.headers['x-request-id'] || uuidv4();
  const originalSend = res.send;

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
      
      // Skip logging for static files and other non-API paths
      if (req.path.startsWith('/static') || !req.path.startsWith('/api')) {
        return;
      }

      // Determine resource type from URL
      let resourceType = 'system';
      const pathParts = req.path.split('/');
      if (pathParts.length > 2) {
        resourceType = pathParts[2]; // e.g., /api/complaints -> complaints
      }

      // Skip logging for very large responses (e.g., file downloads)
      const contentLength = res.get('Content-Length');
      if (contentLength && parseInt(contentLength, 10) > 100000) { // 100KB
        responseBody = '[LARGE_RESPONSE]';
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

      // Log the action (non-blocking)
      AuditLogService.log(logData).catch(error => {
        console.error('Failed to log audit event:', error);
      });
    } catch (error) {
      console.error('Error in audit log middleware:', error);
    }
  });

  next();
}

module.exports = auditLogMiddleware;
