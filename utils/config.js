/**
 * Configuration Management and Validation
 * @module utils/config
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class ConfigManager {
  constructor() {
    this.config = {};
    this.botConfig = {};
    this.loadEnvironment();
    this.loadBotConfig();
    this.validate();
  }

  /**
   * Load and validate environment variables
   */
  loadEnvironment() {
    const required = ['TOKEN', 'CLIENT_ID'];
    const optional = {
      PREFIX: '!',
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      MAX_COMMANDS_PER_MINUTE: '30',
      ENABLE_METRICS: 'false',
    };

    // Check required variables
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
          'Please create a .env file with these variables.',
      );
    }

    // Load configuration
    this.config = {
      token: process.env.TOKEN,
      clientId: process.env.CLIENT_ID,
      prefix: process.env.PREFIX || optional.PREFIX,
      nodeEnv: process.env.NODE_ENV || optional.NODE_ENV,
      logLevel: process.env.LOG_LEVEL || optional.LOG_LEVEL,
      maxCommandsPerMinute: parseInt(
        process.env.MAX_COMMANDS_PER_MINUTE || optional.MAX_COMMANDS_PER_MINUTE,
      ),
      enableMetrics: process.env.ENABLE_METRICS === 'true',
      isDevelopment:
        (process.env.NODE_ENV || optional.NODE_ENV) === 'development',
      isProduction:
        (process.env.NODE_ENV || optional.NODE_ENV) === 'production',
    };
  }

  /**
   * Load bot configuration from JSON
   */
  loadBotConfig() {
    const configPath = path.join(__dirname, '..', 'bot.config.json');

    if (!fs.existsSync(configPath)) {
      logger.warn('bot.config.json not found, using defaults');
      this.botConfig = this.getDefaultBotConfig();
      return;
    }

    try {
      const data = fs.readFileSync(configPath, 'utf8');
      this.botConfig = JSON.parse(data);
    } catch (error) {
      logger.error('Failed to load bot.config.json:', error);
      this.botConfig = this.getDefaultBotConfig();
    }
  }

  /**
   * Get default bot configuration
   * @returns {Object} Default configuration
   */
  getDefaultBotConfig() {
    return {
      name: 'Vibe Bot',
      version: '2.0.0',
      colors: {
        primary: '#0099ff',
        success: '#00ff00',
        warning: '#ffa500',
        error: '#ff0000',
        economy: '#ffd700',
      },
    };
  }

  /**
   * Validate configuration
   */
  validate() {
    // Validate token format
    if (!this.config.token || this.config.token.length < 50) {
      throw new Error('Invalid Discord bot token format');
    }

    // Validate client ID
    if (!/^\d{17,19}$/.test(this.config.clientId)) {
      throw new Error('Invalid Discord client ID format');
    }

    // Validate prefix
    if (this.config.prefix.length > 5) {
      logger.warn('Prefix is longer than 5 characters, this may cause issues');
    }

    // Validate rate limit
    if (
      this.config.maxCommandsPerMinute < 1 ||
      this.config.maxCommandsPerMinute > 100
    ) {
      logger.warn('maxCommandsPerMinute should be between 1 and 100');
    }

    logger.success('Configuration validated successfully');
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @returns {*} Configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Get bot configuration value
   * @param {string} key - Bot configuration key
   * @returns {*} Bot configuration value
   */
  getBotConfig(key) {
    return this.botConfig[key];
  }

  /**
   * Get all configuration
   * @returns {Object} All configuration
   */
  getAll() {
    return { ...this.config, bot: this.botConfig };
  }

  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDev() {
    return this.config.isDevelopment;
  }

  /**
   * Check if running in production mode
   * @returns {boolean}
   */
  isProd() {
    return this.config.isProduction;
  }
}

// Export singleton instance
module.exports = new ConfigManager();
