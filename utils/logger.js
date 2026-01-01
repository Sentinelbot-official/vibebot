const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class Logger {
  constructor(logDir = './logs', options = {}) {
    this.logDir = logDir;
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.maxFiles = options.maxFiles || 14; // Keep 14 days of logs
    this.minLevel = options.minLevel || 'DEBUG'; // Minimum log level
    this.enableConsole = options.enableConsole !== false; // Console logging enabled by default
    this.enableFile = options.enableFile !== false; // File logging enabled by default

    // Log level hierarchy
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      SUCCESS: 2,
      WARN: 3,
      ERROR: 4,
    };

    this.ensureLogDirectory();
    this.startRotationCheck();
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
   * Start periodic log rotation check
   */
  startRotationCheck() {
    // Check for rotation every hour
    setInterval(
      () => {
        this.rotateLogsIfNeeded();
        this.cleanOldLogs();
      },
      60 * 60 * 1000
    );
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
   * Check if log level should be logged
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to log
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  /**
   * Rotate logs if file size exceeds limit
   */
  rotateLogsIfNeeded() {
    try {
      const logFile = this.getLogFilePath();

      if (!fs.existsSync(logFile)) return;

      const stats = fs.statSync(logFile);

      if (stats.size > this.maxFileSize) {
        const timestamp = Date.now();
        const rotatedFile = logFile.replace('.log', `.${timestamp}.log`);

        // Rename current log
        fs.renameSync(logFile, rotatedFile);

        // Compress rotated log
        this.compressLog(rotatedFile);

        this.info('Log file rotated due to size limit', {
          oldFile: rotatedFile,
          size: stats.size,
        });
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  /**
   * Compress a log file
   * @param {string} filePath - Path to log file
   */
  compressLog(filePath) {
    try {
      const gzip = zlib.createGzip();
      const source = fs.createReadStream(filePath);
      const destination = fs.createWriteStream(`${filePath}.gz`);

      source.pipe(gzip).pipe(destination);

      destination.on('finish', () => {
        // Delete original file after compression
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      console.error('Failed to compress log:', error);
    }
  }

  /**
   * Clean old log files
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const logFiles = files
        .filter(f => f.endsWith('.log') || f.endsWith('.log.gz'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          time: fs.statSync(path.join(this.logDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only maxFiles newest logs
      if (logFiles.length > this.maxFiles) {
        const toDelete = logFiles.slice(this.maxFiles);
        toDelete.forEach(file => {
          fs.unlinkSync(file.path);
          this.info('Deleted old log file', { file: file.name });
        });
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }

  /**
   * Write a log entry
   * @param {string} level - Log level (INFO, WARN, ERROR, etc.)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(level, message, data = null) {
    // Check if this level should be logged
    if (!this.shouldLog(level)) return;

    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };

    // Safely stringify data, handling circular references
    let dataString = '';
    if (data) {
      try {
        dataString = ` | ${JSON.stringify(data)}`;
      } catch (error) {
        // Handle circular references
        try {
          dataString = ` | ${JSON.stringify(data, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              // Skip circular references and large objects
              if (value.constructor?.name === 'Client' || value.constructor?.name === 'Guild') {
                return '[Circular]';
              }
            }
            return value;
          })}`;
        } catch {
          dataString = ` | [Unable to stringify]`;
        }
      }
    }

    const logString = `[${timestamp}] [${level}] ${message}${dataString}\n`;

    // Write to file
    if (this.enableFile) {
      try {
        fs.appendFileSync(this.getLogFilePath(), logString, 'utf8');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }

    // Also log to console
    if (this.enableConsole) {
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
