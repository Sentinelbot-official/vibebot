/**
 * Conversation Memory System
 * Stores and retrieves conversation history for AI context
 */

const db = require('./database');

class ConversationMemory {
  constructor() {
    this.maxMessagesPerUser = 20; // Keep last 20 messages
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Add a message to conversation history
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - Message content
   */
  addMessage(userId, guildId, role, content) {
    const key = `${guildId}_${userId}`;
    let history = db.get('conversation_history', key) || [];

    // Add new message
    history.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Remove old messages
    const cutoff = Date.now() - this.maxAge;
    history = history.filter(msg => msg.timestamp > cutoff);

    // Keep only last N messages
    if (history.length > this.maxMessagesPerUser) {
      history = history.slice(-this.maxMessagesPerUser);
    }

    db.set('conversation_history', key, history);
  }

  /**
   * Get conversation history for a user
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @param {number} limit - Max messages to return
   * @returns {Array} Array of messages
   */
  getHistory(userId, guildId, limit = 10) {
    const key = `${guildId}_${userId}`;
    let history = db.get('conversation_history', key) || [];

    // Remove expired messages
    const cutoff = Date.now() - this.maxAge;
    history = history.filter(msg => msg.timestamp > cutoff);

    // Update cleaned history
    if (history.length > 0) {
      db.set('conversation_history', key, history);
    }

    // Return last N messages
    return history.slice(-limit);
  }

  /**
   * Get formatted history for OpenAI API
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @param {number} limit - Max messages to return
   * @returns {Array} Array of {role, content} objects
   */
  getFormattedHistory(userId, guildId, limit = 10) {
    const history = this.getHistory(userId, guildId, limit);
    return history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Clear conversation history for a user
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   */
  clearHistory(userId, guildId) {
    const key = `${guildId}_${userId}`;
    db.delete('conversation_history', key);
  }

  /**
   * Get conversation statistics
   * @param {string} userId - User ID
   * @param {string} guildId - Guild ID
   * @returns {Object} Stats object
   */
  getStats(userId, guildId) {
    const history = this.getHistory(userId, guildId, 100);
    const userMessages = history.filter(msg => msg.role === 'user').length;
    const assistantMessages = history.filter(
      msg => msg.role === 'assistant'
    ).length;
    const oldestMessage = history[0]?.timestamp || Date.now();

    return {
      totalMessages: history.length,
      userMessages,
      assistantMessages,
      oldestMessage,
      age: Date.now() - oldestMessage,
    };
  }

  /**
   * Clean up old conversations across all users
   */
  cleanup() {
    const allKeys = db.all('conversation_history');
    let cleaned = 0;

    for (const [key, history] of Object.entries(allKeys)) {
      const cutoff = Date.now() - this.maxAge;
      const filtered = history.filter(msg => msg.timestamp > cutoff);

      if (filtered.length === 0) {
        db.delete('conversation_history', key);
        cleaned++;
      } else if (filtered.length !== history.length) {
        db.set('conversation_history', key, filtered);
      }
    }

    return cleaned;
  }
}

module.exports = new ConversationMemory();
