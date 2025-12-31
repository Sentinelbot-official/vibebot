const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.ensureLogDirectory();
  }

  /**
   * Ensure the logs directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current timestamp
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Get log file path for today
   * @returns {string} Log file path
   */
  getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${date}.log`);
  }

  /**
   * Write a log entry
   * @param {string} level - Log level (INFO, WARN, ERROR, etc.)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };

    const logString = `[${timestamp}] [${level}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}\n`;

    // Write to file
    try {
      fs.appendFileSync(this.getLogFilePath(), logString, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }

    // Also log to console
    const colors = {
      INFO: '\x1b[36m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      SUCCESS: '\x1b[32m',
      DEBUG: '\x1b[35m',
    };
    const reset = '\x1b[0m';
    const color = colors[level] || '';

    console.log(`${color}${logString.trim()}${reset}`);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info(message, data = null) {
    this.log('INFO', message, data);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  /**
   * Log success message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  success(message, data = null) {
    this.log('SUCCESS', message, data);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug(message, data = null) {
    this.log('DEBUG', message, data);
  }
}

// Export a singleton instance
module.exports = new Logger();
