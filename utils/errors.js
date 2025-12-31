/**
 * Custom Error Classes for Better Error Handling
 * @module utils/errors
 */

/**
 * Base error class for all bot errors
 */
class BotError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Command-related errors
 */
class CommandError extends BotError {
  constructor(message, code = 'COMMAND_ERROR') {
    super(message, code);
  }
}

/**
 * Permission-related errors
 */
class PermissionError extends BotError {
  constructor(message, requiredPermission) {
    super(message, 'PERMISSION_ERROR');
    this.requiredPermission = requiredPermission;
  }
}

/**
 * Cooldown-related errors
 */
class CooldownError extends BotError {
  constructor(message, timeLeft) {
    super(message, 'COOLDOWN_ERROR');
    this.timeLeft = timeLeft;
  }
}

/**
 * Database-related errors
 */
class DatabaseError extends BotError {
  constructor(message, operation) {
    super(message, 'DATABASE_ERROR');
    this.operation = operation;
  }
}

/**
 * Configuration-related errors
 */
class ConfigError extends BotError {
  constructor(message) {
    super(message, 'CONFIG_ERROR');
  }
}

/**
 * Validation-related errors
 */
class ValidationError extends BotError {
  constructor(message, field) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
  }
}

/**
 * Rate limit errors
 */
class RateLimitError extends BotError {
  constructor(message, retryAfter) {
    super(message, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfter;
  }
}

/**
 * API-related errors
 */
class APIError extends BotError {
  constructor(message, statusCode, endpoint) {
    super(message, 'API_ERROR');
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * User-facing errors (safe to show to users)
 */
class UserError extends BotError {
  constructor(message) {
    super(message, 'USER_ERROR');
    this.isUserFacing = true;
  }
}

/**
 * Error handler utility
 */
class ErrorHandler {
  /**
   * Handle command errors
   * @param {Error} error - The error to handle
   * @param {Message} message - Discord message object
   * @param {Logger} logger - Logger instance
   */
  static async handleCommandError(error, message, logger) {
    // Log the error
    logger.error(`Command error in ${message.content}:`, error);

    // Determine user-facing message
    let userMessage = '❌ An unexpected error occurred. Please try again later.';

    if (error instanceof UserError || error instanceof ValidationError) {
      userMessage = `❌ ${error.message}`;
    } else if (error instanceof PermissionError) {
      userMessage = `❌ ${error.message}`;
    } else if (error instanceof CooldownError) {
      userMessage = `⏱️ ${error.message}`;
    } else if (error instanceof CommandError) {
      userMessage = `❌ ${error.message}`;
    }

    // Send error message to user
    try {
      await message.reply(userMessage);
    } catch (replyError) {
      logger.error('Failed to send error message:', replyError);
    }
  }

  /**
   * Handle global errors
   * @param {Error} error - The error to handle
   * @param {Logger} logger - Logger instance
   */
  static handleGlobalError(error, logger) {
    logger.error('Global error:', error);

    // In production, you might want to send to error tracking service
    // e.g., Sentry, Rollbar, etc.
  }

  /**
   * Check if error is operational (expected)
   * @param {Error} error - The error to check
   * @returns {boolean}
   */
  static isOperationalError(error) {
    if (error instanceof BotError) {
      return true;
    }
    return false;
  }
}

module.exports = {
  BotError,
  CommandError,
  PermissionError,
  CooldownError,
  DatabaseError,
  ConfigError,
  ValidationError,
  RateLimitError,
  APIError,
  UserError,
  ErrorHandler,
};
