/**
 * Validate if a string is a valid URL
 * @param {string} string - String to validate
 * @returns {boolean}
 */
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a string is a valid Discord ID (snowflake)
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
function isValidSnowflake(id) {
  return /^\d{17,19}$/.test(id);
}

/**
 * Validate if a string is a valid hex color
 * @param {string} color - Color to validate
 * @returns {boolean}
 */
function isValidHexColor(color) {
  return /^#?[0-9A-F]{6}$/i.test(color);
}

/**
 * Validate if a string is a valid email
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate if a number is within a range
 * @param {number} num - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean}
 */
function isInRange(num, min, max) {
  return num >= min && num <= max;
}

/**
 * Validate if a string contains only alphanumeric characters
 * @param {string} string - String to validate
 * @returns {boolean}
 */
function isAlphanumeric(string) {
  return /^[a-zA-Z0-9]+$/.test(string);
}

/**
 * Validate if a string is a valid Discord mention
 * @param {string} mention - Mention to validate
 * @param {string} type - Type of mention (user, role, channel)
 * @returns {boolean}
 */
function isValidMention(mention, type = 'user') {
  switch (type) {
    case 'user':
      return /^<@!?\d{17,19}>$/.test(mention);
    case 'role':
      return /^<@&\d{17,19}>$/.test(mention);
    case 'channel':
      return /^<#\d{17,19}>$/.test(mention);
    default:
      return false;
  }
}

/**
 * Validate if a string is a valid Discord emoji
 * @param {string} emoji - Emoji to validate
 * @returns {boolean}
 */
function isValidEmoji(emoji) {
  // Custom emoji: <:name:id> or <a:name:id>
  if (/^<a?:\w+:\d{17,19}>$/.test(emoji)) return true;

  // Unicode emoji (basic check)
  if (/\p{Emoji}/u.test(emoji)) return true;

  return false;
}

/**
 * Sanitize user input to prevent injection
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
function sanitizeInput(input) {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/`/g, '\\`') // Escape backticks
    .replace(/@(everyone|here)/gi, '@\u200b$1'); // Zero-width space for @everyone/@here
}

/**
 * Validate if a string length is within limits
 * @param {string} string - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean}
 */
function isValidLength(string, min, max) {
  return string.length >= min && string.length <= max;
}

/**
 * Extract ID from Discord mention
 * @param {string} mention - Mention string
 * @returns {string|null}
 */
function extractId(mention) {
  const match = mention.match(/\d{17,19}/);
  return match ? match[0] : null;
}

/**
 * Validate if a string is a valid invite code
 * @param {string} code - Invite code to validate
 * @returns {boolean}
 */
function isValidInviteCode(code) {
  return /^[a-zA-Z0-9]{2,32}$/.test(code);
}

/**
 * Validate if a string contains profanity (basic check)
 * @param {string} string - String to check
 * @returns {boolean}
 */
function containsProfanity(string) {
  const profanityList = [
    'badword1',
    'badword2',
    // Add your profanity list here
  ];

  const lowerString = string.toLowerCase();
  return profanityList.some(word => lowerString.includes(word));
}

module.exports = {
  isValidURL,
  isValidSnowflake,
  isValidHexColor,
  isValidEmail,
  isInRange,
  isAlphanumeric,
  isValidMention,
  isValidEmoji,
  sanitizeInput,
  isValidLength,
  extractId,
  isValidInviteCode,
  containsProfanity,
};
