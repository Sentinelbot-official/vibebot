/**
 * Transaction Lock Manager
 * Prevents race conditions in economy operations
 */

class TransactionLock {
  constructor() {
    this.locks = new Map();
    this.queue = new Map();
  }

  /**
   * Acquire a lock for a user
   * @param {string} userId - User ID to lock
   * @returns {Promise<Function>} Release function
   */
  async acquire(userId) {
    // Wait if lock already exists
    while (this.locks.has(userId)) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Set lock
    this.locks.set(userId, Date.now());

    // Return release function
    return () => this.release(userId);
  }

  /**
   * Release a lock for a user
   * @param {string} userId - User ID to unlock
   */
  release(userId) {
    this.locks.delete(userId);
  }

  /**
   * Execute a function with a lock
   * @param {string} userId - User ID to lock
   * @param {Function} callback - Function to execute
   * @returns {Promise<any>} Result of callback
   */
  async withLock(userId, callback) {
    const release = await this.acquire(userId);
    try {
      return await callback();
    } finally {
      release();
    }
  }

  /**
   * Execute a function with multiple locks (prevents deadlocks by sorting)
   * @param {Array<string>} userIds - User IDs to lock
   * @param {Function} callback - Function to execute
   * @returns {Promise<any>} Result of callback
   */
  async withMultipleLocks(userIds, callback) {
    // Sort IDs to prevent deadlocks
    const sortedIds = [...userIds].sort();
    const releases = [];

    try {
      // Acquire all locks in order
      for (const userId of sortedIds) {
        const release = await this.acquire(userId);
        releases.push(release);
      }

      // Execute callback
      return await callback();
    } finally {
      // Release all locks
      for (const release of releases) {
        release();
      }
    }
  }

  /**
   * Check if a user is locked
   * @param {string} userId - User ID to check
   * @returns {boolean} True if locked
   */
  isLocked(userId) {
    return this.locks.has(userId);
  }

  /**
   * Clear all locks (use with caution)
   */
  clearAll() {
    this.locks.clear();
  }

  /**
   * Get lock statistics
   * @returns {Object} Lock statistics
   */
  getStats() {
    return {
      activeLocks: this.locks.size,
      lockedUsers: Array.from(this.locks.keys()),
    };
  }
}

// Export singleton instance
module.exports = new TransactionLock();
