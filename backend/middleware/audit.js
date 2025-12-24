const pool = require('../config/database');

/**
 * Audit logging middleware for compliance tracking
 */
const auditLog = (actionType, resourceType = null) => {
  return async (req, res, next) => {
    // Log after response is sent
    const originalSend = res.json;
    res.json = function(data) {
      // Log the action
      logAuditAction(req, actionType, resourceType, data)
        .catch(err => console.error('Audit logging error:', err));
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Log audit action
 */
async function logAuditAction(req, actionType, resourceType, responseData = null) {
  try {
    const userId = req.user?.userId || null;
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    
    const details = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeBody(req.body), // Remove sensitive data
      responseStatus: responseData?.success !== undefined ? responseData.success : null
    };

    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, resource_type, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, actionType, resourceType, ipAddress, userAgent, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Don't throw - audit logging should not break the request
  }
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'mfa_secret', 'backup_codes'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

module.exports = {
  auditLog,
  logAuditAction
};

