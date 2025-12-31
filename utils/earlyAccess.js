const premium = require('./premium');

/**
 * Early Access Feature System
 * Allows premium/VIP users to access beta features before public release
 */

// List of features currently in early access
const EARLY_ACCESS_FEATURES = {
  ai_image_gen: {
    name: 'AI Image Generation',
    description: 'Generate images with AI (DALL-E, Stable Diffusion)',
    minTier: 'premium', // 'premium' or 'vip'
    releaseDate: '2026-02-01', // When it becomes public
  },
  advanced_economy: {
    name: 'Advanced Economy Features',
    description: 'Stock market, real estate, business management',
    minTier: 'premium',
    releaseDate: '2026-01-15',
  },
  custom_commands: {
    name: 'Custom Commands',
    description: 'Create your own custom commands',
    minTier: 'vip',
    releaseDate: '2026-03-01',
  },
  ai_moderation_v2: {
    name: 'AI Moderation v2',
    description: 'Enhanced AI-powered auto-moderation',
    minTier: 'premium',
    releaseDate: '2026-01-20',
  },
};

/**
 * Check if a user has access to an early access feature
 * @param {string} guildId - Discord server ID
 * @param {string} featureKey - Feature key from EARLY_ACCESS_FEATURES
 * @returns {Object} { hasAccess: boolean, reason: string }
 */
function hasEarlyAccess(guildId, featureKey) {
  const feature = EARLY_ACCESS_FEATURES[featureKey];

  if (!feature) {
    return {
      hasAccess: false,
      reason: 'Feature not found',
    };
  }

  // Check if feature is still in early access
  const now = new Date();
  const releaseDate = new Date(feature.releaseDate);

  if (now >= releaseDate) {
    // Feature is now public
    return {
      hasAccess: true,
      reason: 'Feature is now publicly available',
    };
  }

  // Check premium status
  const premiumData = premium.getServerPremium(guildId);

  if (!premiumData) {
    return {
      hasAccess: false,
      reason: `This feature is in early access for ${feature.minTier === 'vip' ? 'VIP' : 'Premium+'} users only!`,
      feature,
    };
  }

  // Check tier requirement
  if (feature.minTier === 'vip' && premiumData.tier !== 'vip') {
    return {
      hasAccess: false,
      reason: 'This feature requires VIP tier!',
      feature,
    };
  }

  // Has access!
  return {
    hasAccess: true,
    reason: `Early access granted (${premiumData.tier.toUpperCase()})`,
    feature,
  };
}

/**
 * Get all early access features available to a server
 * @param {string} guildId - Discord server ID
 * @returns {Array} Array of accessible features
 */
function getAvailableFeatures(guildId) {
  const available = [];
  const premiumData = premium.getServerPremium(guildId);

  for (const [key, feature] of Object.entries(EARLY_ACCESS_FEATURES)) {
    const access = hasEarlyAccess(guildId, key);
    if (access.hasAccess) {
      available.push({
        key,
        ...feature,
      });
    }
  }

  return available;
}

/**
 * Get all early access features (for display purposes)
 * @returns {Object} All early access features
 */
function getAllFeatures() {
  return EARLY_ACCESS_FEATURES;
}

/**
 * Check if a feature is in early access
 * @param {string} featureKey - Feature key
 * @returns {boolean}
 */
function isEarlyAccessFeature(featureKey) {
  return featureKey in EARLY_ACCESS_FEATURES;
}

module.exports = {
  hasEarlyAccess,
  getAvailableFeatures,
  getAllFeatures,
  isEarlyAccessFeature,
  EARLY_ACCESS_FEATURES,
};
