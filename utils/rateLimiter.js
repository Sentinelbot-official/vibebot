/**
 * Advanced Rate Limiter
 * @module utils/rateLimiter
 */

const { RateLimitError } = require('./errors');

class RateLimiter {
  constructor() {
    // User-based rate limiting
    this.userLimits = new Map();
    // Global rate limiting
    this.globalLimits = new Map();
    // Cleanup interval
    this.cleanupInterval = null;
  }

  /**
   * Check if user is rate limited
   * @param {string} userId - User ID
   * @param {string} action - Action being performed
   * @param {Object} options - Rate limit options
   * @returns {Object} Rate limit status
   */
  checkUserLimit(userId, action = 'command', options = {}) {
    const {
      maxRequests = 30,
      windowMs = 60000, // 1 minute
      blockDurationMs = 300000, // 5 minutes
    } = options;

    const key = `${userId}:${action}`;
    const now = Date.now();

    if (!this.userLimits.has(key)) {
      this.userLimits.set(key, {
        requests: [],
        blocked: false,
        blockedUntil: null,
      });
    }

    const limit = this.userLimits.get(key);

    // Check if user is blocked
    if (limit.blocked && limit.blockedUntil > now) {
      const timeLeft = Math.ceil((limit.blockedUntil - now) / 1000);
      return {
        allowed: false,
        blocked: true,
        timeLeft,
        message: `You are temporarily blocked. Try again in ${timeLeft} seconds.`,
      };
    }

    // Unblock if time has passed
    if (limit.blocked && limit.blockedUntil <= now) {
      limit.blocked = false;
      limit.blockedUntil = null;
      limit.requests = [];
    }

    // Remove old requests outside the window
    limit.requests = limit.requests.filter(timestamp => now - timestamp < windowMs);

    // Check if limit exceeded
    if (limit.requests.length >= maxRequests) {
      limit.blocked = true;
      limit.blockedUntil = now + blockDurationMs;

      return {
        allowed: false,
        blocked: true,
        timeLeft: Math.ceil(blockDurationMs / 1000),
        message: `Rate limit exceeded! You are blocked for ${Math.ceil(blockDurationMs / 1000)} seconds.`,
      };
    }

    // Add current request
    limit.requests.push(now);

    return {
      allowed: true,
      blocked: false,
      remaining: maxRequests - limit.requests.length,
      resetAt: now + windowMs,
    };
  }

  /**
   * Check global rate limit
   * @param {string} action - Action being performed
   * @param {Object} options - Rate limit options
   * @returns {boolean} Whether action is allowed
   */
  checkGlobalLimit(action, options = {}) {
    const { maxRequests = 1000, windowMs = 60000 } = options;

    const now = Date.now();

    if (!this.globalLimits.has(action)) {
      this.globalLimits.set(action, []);
    }

    const requests = this.globalLimits.get(action);

    // Remove old requests
    const filtered = requests.filter(timestamp => now - timestamp < windowMs);
    this.globalLimits.set(action, filtered);

    if (filtered.length >= maxRequests) {
      return false;
    }

    filtered.push(now);
    return true;
  }

  /**
   * Reset rate limit for a user
   * @param {string} userId - User ID
   * @param {string} action - Action to reset
   */
  resetUserLimit(userId, action = 'command') {
    const key = `${userId}:${action}`;
    this.userLimits.delete(key);
  }

  /**
   * Check if user is blocked
   * @param {string} userId - User ID
   * @param {string} action - Action to check
   * @returns {boolean} Whether user is blocked
   */
  isUserBlocked(userId, action = 'command') {
    const key = `${userId}:${action}`;
    const limit = this.userLimits.get(key);

    if (!limit) return false;

    return limit.blocked && limit.blockedUntil > Date.now();
  }

  /**
   * Get remaining requests for user
   * @param {string} userId - User ID
   * @param {string} action - Action to check
   * @param {number} maxRequests - Maximum requests allowed
   * @returns {number} Remaining requests
   */
  getRemainingRequests(userId, action = 'command', maxRequests = 30) {
    const key = `${userId}:${action}`;
    const limit = this.userLimits.get(key);

    if (!limit) return maxRequests;

    const now = Date.now();
    const recentRequests = limit.requests.filter(
      timestamp => now - timestamp < 60000
    );

    return Math.max(0, maxRequests - recentRequests.length);
  }

  /**
   * Start cleanup interval to remove old entries
   * @param {number} intervalMs - Cleanup interval in milliseconds
   */
  startCleanup(intervalMs = 300000) {
    // 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      // Clean user limits
      for (const [key, limit] of this.userLimits.entries()) {
        if (!limit.blocked && limit.requests.length === 0) {
          this.userLimits.delete(key);
        }
      }

      // Clean global limits
      for (const [action, requests] of this.globalLimits.entries()) {
        if (requests.length === 0) {
          this.globalLimits.delete(action);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get statistics
   * @returns {Object} Rate limiter statistics
   */
  getStats() {
    return {
      totalUsers: this.userLimits.size,
      blockedUsers: Array.from(this.userLimits.values()).filter(l => l.blocked)
        .length,
      globalActions: this.globalLimits.size,
    };
  }
}

// Export singleton instance
module.exports = new RateLimiter();
