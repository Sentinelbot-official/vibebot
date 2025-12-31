/**
 * Health Check and Monitoring System
 * @module utils/health
 */

const logger = require('./logger');

class HealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      commandsExecuted: 0,
      errors: 0,
      lastError: null,
      memoryUsage: {},
      uptime: 0,
    };
    this.healthChecks = new Map();
    this.isShuttingDown = false;
  }

  /**
   * Register a health check
   * @param {string} name - Health check name
   * @param {Function} checkFn - Async function that returns health status
   */
  registerCheck(name, checkFn) {
    this.healthChecks.set(name, checkFn);
  }

  /**
   * Run all health checks
   * @returns {Promise<Object>} Health status
   */
  async runHealthChecks() {
    const results = {};
    const checks = Array.from(this.healthChecks.entries());

    for (const [name, checkFn] of checks) {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);
        results[name] = { status: 'healthy', ...result };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
        };
        logger.warn(`Health check failed: ${name}`, error);
      }
    }

    return results;
  }

  /**
   * Get overall health status
   * @param {Object} client - Discord client
   * @returns {Promise<Object>} Complete health status
   */
  async getHealth(client) {
    const healthChecks = await this.runHealthChecks();
    const memUsage = process.memoryUsage();

    return {
      status: this.isShuttingDown ? 'shutting_down' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      uptimeFormatted: this.formatUptime(Date.now() - this.startTime),
      bot: {
        ready: client?.isReady() || false,
        guilds: client?.guilds?.cache.size || 0,
        users: client?.users?.cache.size || 0,
        channels: client?.channels?.cache.size || 0,
        ping: client?.ws?.ping || -1,
      },
      metrics: {
        ...this.metrics,
        uptime: Date.now() - this.startTime,
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        unit: 'MB',
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      healthChecks,
    };
  }

  /**
   * Format uptime in human-readable format
   * @param {number} ms - Milliseconds
   * @returns {string} Formatted uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Increment command counter
   */
  incrementCommands() {
    this.metrics.commandsExecuted++;
  }

  /**
   * Increment error counter
   * @param {Error} error - The error that occurred
   */
  incrementErrors(error) {
    this.metrics.errors++;
    this.metrics.lastError = {
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update memory metrics
   */
  updateMemoryMetrics() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage = {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  }

  /**
   * Start periodic health monitoring
   * @param {number} interval - Interval in milliseconds (default: 60000 = 1 minute)
   */
  startMonitoring(interval = 60000) {
    this.monitoringInterval = setInterval(() => {
      this.updateMemoryMetrics();
      this.metrics.uptime = Date.now() - this.startTime;

      // Log metrics periodically
      logger.info('Health metrics:', {
        commands: this.metrics.commandsExecuted,
        errors: this.metrics.errors,
        memory: this.metrics.memoryUsage,
        uptime: this.formatUptime(this.metrics.uptime),
      });
    }, interval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Mark as shutting down
   */
  markShuttingDown() {
    this.isShuttingDown = true;
  }

  /**
   * Get metrics summary
   * @returns {Object} Metrics summary
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      uptimeFormatted: this.formatUptime(Date.now() - this.startTime),
    };
  }
}

// Export singleton instance
module.exports = new HealthMonitor();
