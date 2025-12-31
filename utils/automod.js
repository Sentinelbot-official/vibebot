const db = require('./database');
const logger = require('./logger');

// Spam detection
const userMessages = new Map();
const userWarnings = new Map();

module.exports = {
  /**
   * Check for spam
   * @param {Message} message - Discord message
   * @returns {boolean} Is spam
   */
  checkSpam(message) {
    const userId = message.author.id;
    const now = Date.now();

    if (!userMessages.has(userId)) {
      userMessages.set(userId, []);
    }

    const messages = userMessages.get(userId);

    // Add current message
    messages.push(now);

    // Remove messages older than 5 seconds
    const filtered = messages.filter(time => now - time < 5000);
    userMessages.set(userId, filtered);

    // If more than 5 messages in 5 seconds, it's spam
    if (filtered.length > 5) {
      return true;
    }

    return false;
  },

  /**
   * Check for link spam
   * @param {Message} message - Discord message
   * @returns {boolean} Contains links
   */
  checkLinks(message) {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    return linkRegex.test(message.content);
  },

  /**
   * Check for invite links
   * @param {Message} message - Discord message
   * @returns {boolean} Contains invite links
   */
  checkInvites(message) {
    const inviteRegex =
      /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/g;
    return inviteRegex.test(message.content);
  },

  /**
   * Check for excessive caps
   * @param {Message} message - Discord message
   * @returns {boolean} Excessive caps
   */
  checkCaps(message) {
    const content = message.content;
    if (content.length < 10) return false;

    const caps = content.replace(/[^A-Z]/g, '').length;
    const total = content.replace(/[^A-Za-z]/g, '').length;

    if (total === 0) return false;

    const percentage = (caps / total) * 100;
    return percentage > 70; // More than 70% caps
  },

  /**
   * Check for mass mentions
   * @param {Message} message - Discord message
   * @returns {boolean} Mass mentions
   */
  checkMassMentions(message) {
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    return mentions > 5;
  },

  /**
   * Handle auto-mod action
   * @param {Message} message - Discord message
   * @param {string} reason - Reason for action
   */
  async handleViolation(message, reason) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Get guild automod settings
    const settings = db.get('guild_settings', guildId) || {};
    const automod = settings.automod || {};

    if (!automod.enabled) return;

    // Delete the message
    await message.delete().catch(() => {});

    // Track warnings
    if (!userWarnings.has(userId)) {
      userWarnings.set(userId, 0);
    }

    const warnings = userWarnings.get(userId) + 1;
    userWarnings.set(userId, warnings);

    // Send warning
    const warningMsg = await message.channel.send(
      `⚠️ ${message.author}, ${reason}! (Warning ${warnings}/3)`
    );

    setTimeout(() => warningMsg.delete().catch(() => {}), 5000);

    // Take action based on warnings
    if (warnings >= 3) {
      const member = message.guild.members.cache.get(userId);
      if (member && member.moderatable) {
        // Timeout for 10 minutes
        await member
          .timeout(10 * 60 * 1000, `Auto-mod: ${reason}`)
          .catch(() => {});
        message.channel
          .send(
            `🔨 ${message.author} has been timed out for 10 minutes (auto-mod).`
          )
          .then(m => {
            setTimeout(() => m.delete().catch(() => {}), 10000);
          });
      }
      userWarnings.delete(userId);
    }

    logger.warn(`Auto-mod: ${reason}`, {
      user: message.author.tag,
      guild: message.guild.name,
      warnings,
    });
  },

  /**
   * Clear user warnings after 1 hour
   */
  startWarningCleanup() {
    setInterval(
      () => {
        userWarnings.clear();
        logger.info('Auto-mod warnings cleared');
      },
      60 * 60 * 1000
    ); // 1 hour
  },
};
