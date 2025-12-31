const cooldowns = new Map();

module.exports = {
  /**
   * Check if user is on cooldown for a command
   * @param {string} userId - User ID
   * @param {string} commandName - Command name
   * @param {number} cooldownTime - Cooldown in seconds
   * @returns {number|null} Time left in seconds or null if not on cooldown
   */
  check(userId, commandName, cooldownTime) {
    const key = `${userId}-${commandName}`;

    if (!cooldowns.has(key)) {
      return null;
    }

    const expirationTime = cooldowns.get(key);
    const now = Date.now();

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return Math.ceil(timeLeft);
    }

    cooldowns.delete(key);
    return null;
  },

  /**
   * Set cooldown for a user on a command
   * @param {string} userId - User ID
   * @param {string} commandName - Command name
   * @param {number} cooldownTime - Cooldown in seconds
   */
  set(userId, commandName, cooldownTime) {
    const key = `${userId}-${commandName}`;
    const expirationTime = Date.now() + cooldownTime * 1000;
    cooldowns.set(key, expirationTime);

    // Auto-cleanup after cooldown expires
    setTimeout(() => {
      cooldowns.delete(key);
    }, cooldownTime * 1000);
  },

  /**
   * Clear cooldown for a user on a command
   * @param {string} userId - User ID
   * @param {string} commandName - Command name
   */
  clear(userId, commandName) {
    const key = `${userId}-${commandName}`;
    cooldowns.delete(key);
  },

  /**
   * Clear all cooldowns for a user
   * @param {string} userId - User ID
   */
  clearUser(userId) {
    for (const key of cooldowns.keys()) {
      if (key.startsWith(userId)) {
        cooldowns.delete(key);
      }
    }
  },

  /**
   * Get all active cooldowns
   * @returns {Map} All cooldowns
   */
  getAll() {
    return cooldowns;
  },
};
