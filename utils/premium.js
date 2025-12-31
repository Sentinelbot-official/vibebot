const db = require('./database');
const logger = require('./logger');
const crypto = require('crypto');

/**
 * Premium/VIP System with Activation Keys
 * Supports per-server premium activation
 */

const PREMIUM_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  VIP: 'vip',
};

class PremiumManager {
  constructor() {
    this.initDatabase();
  }

  /**
   * Initialize premium database tables
   */
  initDatabase() {
    try {
      // Server premium status
      db.set('premium_servers', 'initialized', {
        timestamp: Date.now(),
      });

      // Activation keys
      db.set('activation_keys', 'initialized', {
        timestamp: Date.now(),
      });

      logger.success('Premium system initialized');
    } catch (error) {
      logger.error('Failed to initialize premium system:', error);
    }
  }

  /**
   * Generate a new activation key
   * @param {string} tier - 'premium' or 'vip'
   * @param {number} duration - Duration in days (0 = lifetime)
   * @param {number} maxUses - Maximum uses (0 = unlimited)
   * @returns {string} Generated key
   */
  generateKey(tier = 'premium', duration = 30, maxUses = 1) {
    const key = `VIBE-${tier.toUpperCase()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const keyData = {
      key,
      tier,
      duration, // days
      maxUses,
      uses: 0,
      createdAt: Date.now(),
      expiresAt: duration > 0 ? Date.now() + duration * 24 * 60 * 60 * 1000 : 0,
      activatedServers: [],
    };

    db.set('activation_keys', key, keyData);
    logger.info(`Generated ${tier} key: ${key}`);

    return key;
  }

  /**
   * Activate a key for a server
   * @param {string} guildId - Discord server ID
   * @param {string} key - Activation key
   * @param {string} activatedBy - User ID who activated
   * @returns {Object} Result object
   */
  activateKey(guildId, key, activatedBy) {
    try {
      // Get key data
      const keyData = db.get('activation_keys', key);

      if (!keyData) {
        return {
          success: false,
          message: '❌ Invalid activation key!',
        };
      }

      // Check if key is expired
      if (keyData.expiresAt > 0 && Date.now() > keyData.expiresAt) {
        return {
          success: false,
          message: '❌ This activation key has expired!',
        };
      }

      // Check if key has reached max uses
      if (keyData.maxUses > 0 && keyData.uses >= keyData.maxUses) {
        return {
          success: false,
          message: '❌ This activation key has been fully used!',
        };
      }

      // Check if server already has premium
      const existingPremium = this.getServerPremium(guildId);
      if (
        existingPremium &&
        existingPremium.tier === 'vip' &&
        keyData.tier === 'premium'
      ) {
        return {
          success: false,
          message:
            '❌ This server already has VIP! Cannot downgrade to Premium.',
        };
      }

      // Calculate expiration
      const expiresAt =
        keyData.duration > 0
          ? Date.now() + keyData.duration * 24 * 60 * 60 * 1000
          : 0; // 0 = lifetime

      // Activate premium for server
      const premiumData = {
        guildId,
        tier: keyData.tier,
        activatedAt: Date.now(),
        expiresAt,
        activatedBy,
        activationKey: key,
      };

      db.set('premium_servers', guildId, premiumData);

      // Update key usage
      keyData.uses += 1;
      keyData.activatedServers.push({
        guildId,
        activatedAt: Date.now(),
        activatedBy,
      });
      db.set('activation_keys', key, keyData);

      logger.success(
        `${keyData.tier.toUpperCase()} activated for server ${guildId} by ${activatedBy}`
      );

      return {
        success: true,
        tier: keyData.tier,
        duration: keyData.duration,
        expiresAt,
        message: `✅ ${keyData.tier.toUpperCase()} activated successfully!`,
      };
    } catch (error) {
      logger.error('Error activating key:', error);
      return {
        success: false,
        message: '❌ An error occurred while activating the key.',
      };
    }
  }

  /**
   * Check if a server has premium/VIP
   * @param {string} guildId - Discord server ID
   * @returns {Object|null} Premium data or null
   */
  getServerPremium(guildId) {
    try {
      const premiumData = db.get('premium_servers', guildId);

      if (!premiumData) {
        return null;
      }

      // Check if expired
      if (premiumData.expiresAt > 0 && Date.now() > premiumData.expiresAt) {
        // Premium expired, remove it
        db.delete('premium_servers', guildId);
        logger.info(`Premium expired for server ${guildId}`);
        return null;
      }

      return premiumData;
    } catch (error) {
      logger.error('Error checking server premium:', error);
      return null;
    }
  }

  /**
   * Get server tier (free, premium, or vip)
   * @param {string} guildId - Discord server ID
   * @returns {string} Tier name
   */
  getServerTier(guildId) {
    const premium = this.getServerPremium(guildId);
    return premium ? premium.tier : PREMIUM_TIERS.FREE;
  }

  /**
   * Check if server has premium or VIP
   * @param {string} guildId - Discord server ID
   * @returns {boolean}
   */
  hasPremium(guildId) {
    const tier = this.getServerTier(guildId);
    return tier === PREMIUM_TIERS.PREMIUM || tier === PREMIUM_TIERS.VIP;
  }

  /**
   * Check if server has VIP
   * @param {string} guildId - Discord server ID
   * @returns {boolean}
   */
  hasVIP(guildId) {
    return this.getServerTier(guildId) === PREMIUM_TIERS.VIP;
  }

  /**
   * Revoke premium from a server
   * @param {string} guildId - Discord server ID
   * @returns {boolean} Success
   */
  revokePremium(guildId) {
    try {
      db.delete('premium_servers', guildId);
      logger.info(`Premium revoked for server ${guildId}`);
      return true;
    } catch (error) {
      logger.error('Error revoking premium:', error);
      return false;
    }
  }

  /**
   * Get all premium servers
   * @returns {Array} Array of premium servers
   */
  getAllPremiumServers() {
    try {
      const allData = db.getAll('premium_servers');
      return allData.filter(item => item.key !== 'initialized');
    } catch (error) {
      logger.error('Error getting premium servers:', error);
      return [];
    }
  }

  /**
   * Get all activation keys
   * @returns {Array} Array of activation keys
   */
  getAllKeys() {
    try {
      const allData = db.getAll('activation_keys');
      return allData.filter(item => item.key !== 'initialized');
    } catch (error) {
      logger.error('Error getting activation keys:', error);
      return [];
    }
  }

  /**
   * Delete an activation key
   * @param {string} key - Activation key
   * @returns {boolean} Success
   */
  deleteKey(key) {
    try {
      db.delete('activation_keys', key);
      logger.info(`Deleted activation key: ${key}`);
      return true;
    } catch (error) {
      logger.error('Error deleting key:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new PremiumManager();
