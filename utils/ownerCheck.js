/**
 * Owner-Only Command System
 * @module utils/ownerCheck
 *
 * Security system for sensitive bot owner commands.
 * Prevents unauthorized access to dangerous commands.
 */

const config = require('./config');
const logger = require('./logger');

class OwnerCheck {
  /**
   * Check if a user is a bot owner
   * @param {string} userId - Discord user ID to check
   * @returns {boolean} True if user is an owner
   */
  static isOwner(userId) {
    const ownerIds = config.get('ownerIds');

    if (!ownerIds || ownerIds.length === 0) {
      logger.warn(
        '⚠️ No owner IDs configured! Owner-only commands are disabled.'
      );
      return false;
    }

    return ownerIds.includes(userId);
  }

  /**
   * Check if a user can execute an owner-only command
   * @param {Message} message - Discord message object
   * @returns {Object} Result with canExecute boolean and reason
   */
  static canExecute(message) {
    const userId = message.author.id;
    const isOwner = this.isOwner(userId);

    if (!isOwner) {
      logger.warn(
        `🚫 Unauthorized owner command attempt by ${message.author.tag} (${userId})`
      );
      return {
        canExecute: false,
        reason: '❌ This command is restricted to bot owners only.',
      };
    }

    logger.info(
      `✅ Owner command authorized for ${message.author.tag} (${userId})`
    );

    return {
      canExecute: true,
      reason: null,
    };
  }

  /**
   * Get list of owner IDs (for display purposes)
   * @returns {Array<string>} Array of owner IDs
   */
  static getOwnerIds() {
    return config.get('ownerIds') || [];
  }

  /**
   * Check if owner system is configured
   * @returns {boolean} True if at least one owner is configured
   */
  static isConfigured() {
    const ownerIds = config.get('ownerIds');
    return ownerIds && ownerIds.length > 0;
  }

  /**
   * Get owner mention tags for display
   * @returns {string} Formatted owner mentions
   */
  static getOwnerMentions() {
    const ownerIds = this.getOwnerIds();
    if (ownerIds.length === 0) {
      return 'No owners configured';
    }
    return ownerIds.map(id => `<@${id}>`).join(', ');
  }
}

module.exports = OwnerCheck;
