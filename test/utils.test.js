/**
 * Unit Tests for Utility Functions
 * Run with: node --test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Import utilities to test
const { formatTime, parseTime } = require('../utils/timeUtils');
const {
  isValidURL,
  isValidSnowflake,
  isValidHexColor,
  sanitizeInput,
} = require('../utils/validators');

describe('Time Utils', () => {
  it('should parse time strings correctly', () => {
    assert.strictEqual(parseTime('1h'), 3600000);
    assert.strictEqual(parseTime('30m'), 1800000);
    assert.strictEqual(parseTime('1d'), 86400000);
  });

  it('should format time correctly', () => {
    const formatted = formatTime(3600000);
    assert.ok(formatted.includes('hour') || formatted.includes('h'));
  });
});

describe('Validators', () => {
  it('should validate URLs correctly', () => {
    assert.strictEqual(isValidURL('https://example.com'), true);
    assert.strictEqual(isValidURL('not a url'), false);
  });

  it('should validate Discord snowflakes', () => {
    assert.strictEqual(isValidSnowflake('123456789012345678'), true);
    assert.strictEqual(isValidSnowflake('12345'), false);
    assert.strictEqual(isValidSnowflake('not a number'), false);
  });

  it('should validate hex colors', () => {
    assert.strictEqual(isValidHexColor('#FF0000'), true);
    assert.strictEqual(isValidHexColor('FF0000'), true);
    assert.strictEqual(isValidHexColor('#FFF'), false);
    assert.strictEqual(isValidHexColor('not a color'), false);
  });

  it('should sanitize input correctly', () => {
    const dangerous = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(dangerous);
    assert.ok(!sanitized.includes('<script>'));
  });
});

describe('Rate Limiter', () => {
  const rateLimiter = require('../utils/rateLimiter');

  it('should allow requests within limit', () => {
    const userId = 'test_user_1';
    const result = rateLimiter.checkUserLimit(userId, 'test', {
      maxRequests: 5,
      windowMs: 60000,
    });
    assert.strictEqual(result.allowed, true);
  });

  it('should block requests exceeding limit', () => {
    const userId = 'test_user_2';

    // Make requests up to limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkUserLimit(userId, 'test2', {
        maxRequests: 5,
        windowMs: 60000,
      });
    }

    // Next request should be blocked
    const result = rateLimiter.checkUserLimit(userId, 'test2', {
      maxRequests: 5,
      windowMs: 60000,
    });
    assert.strictEqual(result.allowed, false);
  });
});

describe('Error Classes', () => {
  const {
    BotError,
    CommandError,
    ValidationError,
  } = require('../utils/errors');

  it('should create BotError correctly', () => {
    const error = new BotError('Test error', 'TEST_CODE');
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.code, 'TEST_CODE');
    assert.ok(error.timestamp);
  });

  it('should create CommandError correctly', () => {
    const error = new CommandError('Command failed');
    assert.strictEqual(error.name, 'CommandError');
    assert.strictEqual(error.code, 'COMMAND_ERROR');
  });

  it('should serialize errors to JSON', () => {
    const error = new ValidationError('Invalid input', 'username');
    const json = error.toJSON();
    assert.ok(json.name);
    assert.ok(json.message);
    assert.ok(json.code);
    assert.ok(json.timestamp);
  });
});

describe('Health Monitor', () => {
  const health = require('../utils/health');

  it('should track metrics', () => {
    health.incrementCommands();
    const metrics = health.getMetrics();
    assert.ok(metrics.commandsExecuted > 0);
  });

  it('should format uptime correctly', () => {
    const formatted = health.formatUptime(3661000); // 1 hour, 1 minute, 1 second
    assert.ok(formatted.includes('h') || formatted.includes('hour'));
  });
});
