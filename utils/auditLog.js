/**
 * Audit Logging System
 * Logs sensitive operations for security monitoring
 */

const db = require('./database');
const logger = require('./logger');

class AuditLog {
  /**
   * Log a sensitive operation
   * @param {Object} data - Audit data
   */
  log(data) {
    const entry = {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      ...data,
    };

    // Store in database
    const auditKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    db.set('audit_logs', auditKey, entry);

    // Also log to console for immediate visibility
    logger.warn(`[AUDIT] ${data.action} by ${data.userId} (${data.username})`);

    return entry;
  }

  /**
   * Log owner command execution
   * @param {Object} params - Command parameters
   */
  logOwnerCommand({ userId, username, command, args, guildId, guildName }) {
    return this.log({
      type: 'owner_command',
      action: `Owner command: ${command}`,
      userId,
      username,
      command,
      args: args.join(' '),
      guildId,
      guildName,
      severity: 'high',
    });
  }

  /**
   * Log eval/code execution
   * @param {Object} params - Execution parameters
   */
  logCodeExecution({ userId, username, code, result, error }) {
    return this.log({
      type: 'code_execution',
      action: 'Code execution via eval',
      userId,
      username,
      code: code.substring(0, 500), // Limit code length
      result: result ? String(result).substring(0, 500) : null,
      error: error ? error.message : null,
      severity: 'critical',
    });
  }

  /**
   * Log mass moderation action
   * @param {Object} params - Action parameters
   */
  logMassAction({ userId, username, action, targetCount, guildId, guildName }) {
    return this.log({
      type: 'mass_action',
      action: `Mass ${action}`,
      userId,
      username,
      targetCount,
      guildId,
      guildName,
      severity: 'high',
    });
  }

  /**
   * Log premium activation
   * @param {Object} params - Activation parameters
   */
  logPremiumActivation({ userId, username, key, tier, guildId, guildName }) {
    return this.log({
      type: 'premium_activation',
      action: 'Premium activated',
      userId,
      username,
      key,
      tier,
      guildId,
      guildName,
      severity: 'medium',
    });
  }

  /**
   * Log failed authentication attempt
   * @param {Object} params - Attempt parameters
   */
  logFailedAuth({ userId, username, command, reason }) {
    return this.log({
      type: 'failed_auth',
      action: 'Failed authentication',
      userId,
      username,
      command,
      reason,
      severity: 'high',
    });
  }

  /**
   * Get recent audit logs
   * @param {number} limit - Number of logs to retrieve
   * @returns {Array} Recent audit logs
   */
  getRecent(limit = 50) {
    const allLogs = db.getAll('audit_logs');
    return allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Get audit logs by user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to retrieve
   * @returns {Array} User's audit logs
   */
  getByUser(userId, limit = 50) {
    const allLogs = db.getAll('audit_logs');
    return allLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get audit logs by type
   * @param {string} type - Log type
   * @param {number} limit - Number of logs to retrieve
   * @returns {Array} Filtered audit logs
   */
  getByType(type, limit = 50) {
    const allLogs = db.getAll('audit_logs');
    return allLogs
      .filter(log => log.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear old audit logs (older than specified days)
   * @param {number} days - Days to keep
   * @returns {number} Number of logs deleted
   */
  clearOld(days = 30) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const allLogs = db.all('audit_logs');
    let deleted = 0;

    for (const [key, log] of Object.entries(allLogs)) {
      if (log.timestamp < cutoff) {
        db.delete('audit_logs', key);
        deleted++;
      }
    }

    logger.info(`Cleared ${deleted} old audit logs`);
    return deleted;
  }
}

// Export singleton instance
module.exports = new AuditLog();
