const premium = require('./premium');
const logger = require('./logger');
const db = require('./database');

/**
 * Premium Perks System
 * Manages multipliers, bonuses, and benefits for Premium/VIP users
 */

const PERK_MULTIPLIERS = {
  free: {
    xp: 1.0,
    economy: 1.0,
    daily: 1.0,
    cooldown: 1.0,
    robLimit: 1.0,
    shopDiscount: 0,
  },
  premium: {
    xp: 1.5,
    economy: 1.5,
    daily: 2.0,
    cooldown: 0.5, // 50% faster (multiply cooldown by 0.5)
    robLimit: 1.5,
    shopDiscount: 0.1, // 10% discount
  },
  vip: {
    xp: 2.0,
    economy: 2.0,
    daily: 3.0,
    cooldown: 0.25, // 75% faster
    robLimit: 2.0,
    shopDiscount: 0.25, // 25% discount
  },
};

const PREMIUM_LIMITS = {
  free: {
    maxCustomCommands: 0,
    maxAutoRoles: 3,
    maxWelcomeMessages: 1,
    maxCustomEmbeds: 0,
    aiImageGenerations: 5, // per day
    maxPollOptions: 5,
  },
  premium: {
    maxCustomCommands: 10,
    maxAutoRoles: 10,
    maxWelcomeMessages: 5,
    maxCustomEmbeds: 25,
    aiImageGenerations: 50, // per day
    maxPollOptions: 15,
  },
  vip: {
    maxCustomCommands: 50,
    maxAutoRoles: 25,
    maxWelcomeMessages: 15,
    maxCustomEmbeds: 100,
    aiImageGenerations: 200, // per day
    maxPollOptions: 25,
  },
};

const EXCLUSIVE_FEATURES = {
  free: [],
  premium: [
    'custom_status',
    'premium_badge',
    'early_access',
    'advanced_analytics',
    'custom_embeds',
    'priority_support',
    'reduced_cooldowns',
    'economy_bonuses',
  ],
  vip: [
    'custom_status',
    'premium_badge',
    'early_access',
    'advanced_analytics',
    'custom_embeds',
    'priority_support',
    'reduced_cooldowns',
    'economy_bonuses',
    'custom_commands',
    'ai_chat',
    'advanced_moderation',
    'server_analytics',
    'auto_posting',
    'unlimited_ai_images',
  ],
};

class PremiumPerks {
  /**
   * Get multiplier for a specific perk
   * @param {string} guildId - Discord server ID
   * @param {string} perkType - Type of perk (xp, economy, daily, etc.)
   * @returns {number} Multiplier value
   */
  getMultiplier(guildId, perkType) {
    const tier = premium.getServerTier(guildId);
    return PERK_MULTIPLIERS[tier]?.[perkType] || 1.0;
  }

  /**
   * Get all multipliers for a server
   * @param {string} guildId - Discord server ID
   * @returns {Object} All multipliers
   */
  getAllMultipliers(guildId) {
    const tier = premium.getServerTier(guildId);
    return PERK_MULTIPLIERS[tier] || PERK_MULTIPLIERS.free;
  }

  /**
   * Apply XP multiplier
   * @param {string} guildId - Discord server ID
   * @param {number} baseXP - Base XP amount
   * @returns {number} Multiplied XP
   */
  applyXPMultiplier(guildId, baseXP) {
    const multiplier = this.getMultiplier(guildId, 'xp');
    return Math.floor(baseXP * multiplier);
  }

  /**
   * Apply economy multiplier
   * @param {string} guildId - Discord server ID
   * @param {number} baseAmount - Base amount
   * @returns {number} Multiplied amount
   */
  applyEconomyMultiplier(guildId, baseAmount) {
    const multiplier = this.getMultiplier(guildId, 'economy');
    return Math.floor(baseAmount * multiplier);
  }

  /**
   * Apply daily reward multiplier
   * @param {string} guildId - Discord server ID
   * @param {number} baseReward - Base daily reward
   * @returns {number} Multiplied reward
   */
  applyDailyMultiplier(guildId, baseReward) {
    const multiplier = this.getMultiplier(guildId, 'daily');
    return Math.floor(baseReward * multiplier);
  }

  /**
   * Apply cooldown reduction
   * @param {string} guildId - Discord server ID
   * @param {number} baseCooldown - Base cooldown in seconds
   * @returns {number} Reduced cooldown
   */
  applyCooldownReduction(guildId, baseCooldown) {
    const multiplier = this.getMultiplier(guildId, 'cooldown');
    return Math.floor(baseCooldown * multiplier);
  }

  /**
   * Apply rob limit multiplier
   * @param {string} guildId - Discord server ID
   * @param {number} baseLimit - Base rob limit
   * @returns {number} Multiplied limit
   */
  applyRobLimitMultiplier(guildId, baseLimit) {
    const multiplier = this.getMultiplier(guildId, 'robLimit');
    return Math.floor(baseLimit * multiplier);
  }

  /**
   * Get shop discount
   * @param {string} guildId - Discord server ID
   * @returns {number} Discount percentage (0-1)
   */
  getShopDiscount(guildId) {
    return this.getMultiplier(guildId, 'shopDiscount');
  }

  /**
   * Apply shop discount to price
   * @param {string} guildId - Discord server ID
   * @param {number} basePrice - Base price
   * @returns {number} Discounted price
   */
  applyShopDiscount(guildId, basePrice) {
    const discount = this.getShopDiscount(guildId);
    return Math.floor(basePrice * (1 - discount));
  }

  /**
   * Get limit for a specific feature
   * @param {string} guildId - Discord server ID
   * @param {string} limitType - Type of limit
   * @returns {number} Limit value
   */
  getLimit(guildId, limitType) {
    const tier = premium.getServerTier(guildId);
    return PREMIUM_LIMITS[tier]?.[limitType] || 0;
  }

  /**
   * Check if server has access to a feature
   * @param {string} guildId - Discord server ID
   * @param {string} featureName - Feature name
   * @returns {boolean} Has access
   */
  hasFeature(guildId, featureName) {
    const tier = premium.getServerTier(guildId);
    return EXCLUSIVE_FEATURES[tier]?.includes(featureName) || false;
  }

  /**
   * Get all features available to a server
   * @param {string} guildId - Discord server ID
   * @returns {Array} Array of feature names
   */
  getAvailableFeatures(guildId) {
    const tier = premium.getServerTier(guildId);
    return EXCLUSIVE_FEATURES[tier] || [];
  }

  /**
   * Get premium tier badge emoji
   * @param {string} guildId - Discord server ID
   * @returns {string} Badge emoji
   */
  getTierBadge(guildId) {
    const tier = premium.getServerTier(guildId);
    const badges = {
      free: '⚪',
      premium: '💎',
      vip: '👑',
    };
    return badges[tier] || badges.free;
  }

  /**
   * Get premium tier display name
   * @param {string} guildId - Discord server ID
   * @returns {string} Tier display name
   */
  getTierDisplayName(guildId) {
    const tier = premium.getServerTier(guildId);
    const names = {
      free: 'Free',
      premium: 'Premium',
      vip: 'VIP',
    };
    return names[tier] || names.free;
  }

  /**
   * Get formatted perks summary for a server
   * @param {string} guildId - Discord server ID
   * @returns {Object} Formatted perks summary
   */
  getPerksSummary(guildId) {
    const tier = premium.getServerTier(guildId);
    const multipliers = this.getAllMultipliers(guildId);
    const limits = PREMIUM_LIMITS[tier] || PREMIUM_LIMITS.free;
    const features = this.getAvailableFeatures(guildId);

    return {
      tier,
      badge: this.getTierBadge(guildId),
      displayName: this.getTierDisplayName(guildId),
      multipliers,
      limits,
      features,
    };
  }

  /**
   * Check if user can use AI image generation
   * @param {string} guildId - Discord server ID
   * @param {string} userId - User ID
   * @param {Object} db - Database instance
   * @returns {Object} { canUse: boolean, remaining: number, limit: number }
   */
  checkAIImageLimit(guildId, userId, db) {
    const limit = this.getLimit(guildId, 'aiImageGenerations');
    const tier = premium.getServerTier(guildId);

    // VIP gets unlimited
    if (tier === 'vip') {
      return {
        canUse: true,
        remaining: Infinity,
        limit: Infinity,
        unlimited: true,
      };
    }

    // Check daily usage
    const today = new Date().toDateString();
    const usageKey = `ai_image_usage_${userId}_${today}`;
    const usage = db.get('ai_limits', usageKey) || { count: 0, date: today };

    const remaining = limit - usage.count;

    return {
      canUse: remaining > 0,
      remaining: Math.max(0, remaining),
      limit,
      unlimited: false,
    };
  }

  /**
   * Increment AI image usage
   * @param {string} guildId - Discord server ID
   * @param {string} userId - User ID
   * @param {Object} db - Database instance
   */
  incrementAIImageUsage(guildId, userId, db) {
    const tier = premium.getServerTier(guildId);

    // VIP gets unlimited, don't track
    if (tier === 'vip') {
      return;
    }

    const today = new Date().toDateString();
    const usageKey = `ai_image_usage_${userId}_${today}`;
    const usage = db.get('ai_limits', usageKey) || { count: 0, date: today };

    usage.count += 1;
    usage.date = today;

    db.set('ai_limits', usageKey, usage);
  }
}

// Export singleton instance
module.exports = new PremiumPerks();
