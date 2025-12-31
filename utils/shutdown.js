/**
 * Graceful Shutdown Handler
 * @module utils/shutdown
 */

const logger = require('./logger');

class ShutdownHandler {
  constructor() {
    this.isShuttingDown = false;
    this.shutdownCallbacks = [];
    this.shutdownTimeout = 30000; // 30 seconds
  }

  /**
   * Register a cleanup callback
   * @param {Function} callback - Async function to call during shutdown
   * @param {string} name - Name of the cleanup task
   */
  register(callback, name = 'unnamed') {
    this.shutdownCallbacks.push({ callback, name });
  }

  /**
   * Initialize shutdown handlers
   * @param {Object} client - Discord client
   */
  init(client) {
    // Handle SIGTERM (Docker, Kubernetes, etc.)
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM signal');
      this.shutdown(client, 'SIGTERM');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('Received SIGINT signal');
      this.shutdown(client, 'SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      logger.error('Uncaught exception:', error);
      this.shutdown(client, 'UNCAUGHT_EXCEPTION', 1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection:', reason);
      logger.error('Promise:', promise);
      // Don't exit on unhandled rejection in production
      if (process.env.NODE_ENV === 'development') {
        this.shutdown(client, 'UNHANDLED_REJECTION', 1);
      }
    });

    // Handle warnings
    process.on('warning', warning => {
      logger.warn('Process warning:', warning);
    });

    logger.success('Shutdown handlers initialized');
  }

  /**
   * Perform graceful shutdown
   * @param {Object} client - Discord client
   * @param {string} reason - Shutdown reason
   * @param {number} exitCode - Exit code (default: 0)
   */
  async shutdown(client, reason = 'UNKNOWN', exitCode = 0) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Starting graceful shutdown (reason: ${reason})`);

    // Set timeout for forced shutdown
    const forceShutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Run cleanup callbacks
      logger.info(`Running ${this.shutdownCallbacks.length} cleanup tasks...`);

      for (const { callback, name } of this.shutdownCallbacks) {
        try {
          logger.info(`Running cleanup: ${name}`);
          await callback();
          logger.success(`Cleanup completed: ${name}`);
        } catch (error) {
          logger.error(`Cleanup failed: ${name}`, error);
        }
      }

      // Destroy Discord client
      if (client && client.isReady()) {
        logger.info('Destroying Discord client...');
        await client.destroy();
        logger.success('Discord client destroyed');
      }

      // Clear the force shutdown timer
      clearTimeout(forceShutdownTimer);

      logger.success(`Graceful shutdown completed (exit code: ${exitCode})`);
      process.exit(exitCode);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Check if shutdown is in progress
   * @returns {boolean}
   */
  isShuttingDownNow() {
    return this.isShuttingDown;
  }
}

// Export singleton instance
module.exports = new ShutdownHandler();
