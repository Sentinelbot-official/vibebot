const ms = require('ms');

/**
 * Parse time string to milliseconds
 * @param {string} timeString - Time string (e.g., "1h", "30m", "1d")
 * @returns {number|null} Milliseconds or null if invalid
 */
function parseTime(timeString) {
  try {
    return ms(timeString);
  } catch {
    return null;
  }
}

/**
 * Format milliseconds to human readable string
 * @param {number} milliseconds - Time in milliseconds
 * @param {boolean} long - Use long format (e.g., "1 hour" vs "1h")
 * @returns {string}
 */
function formatTime(milliseconds, long = false) {
  return ms(milliseconds, { long });
}

/**
 * Get relative timestamp for Discord
 * @param {Date|number} date - Date object or timestamp
 * @param {string} style - Discord timestamp style (t, T, d, D, f, F, R)
 * @returns {string}
 */
function discordTimestamp(date, style = 'R') {
  const timestamp =
    date instanceof Date
      ? Math.floor(date.getTime() / 1000)
      : Math.floor(date / 1000);
  return `<t:${timestamp}:${style}>`;
}

/**
 * Format duration in seconds to readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Get time until a future date
 * @param {Date|number} futureDate - Future date or timestamp
 * @returns {string}
 */
function timeUntil(futureDate) {
  const now = Date.now();
  const future = futureDate instanceof Date ? futureDate.getTime() : futureDate;
  const diff = future - now;

  if (diff <= 0) return 'Now';

  return formatTime(diff, true);
}

/**
 * Get time since a past date
 * @param {Date|number} pastDate - Past date or timestamp
 * @returns {string}
 */
function timeSince(pastDate) {
  const now = Date.now();
  const past = pastDate instanceof Date ? pastDate.getTime() : pastDate;
  const diff = now - past;

  if (diff <= 0) return 'Just now';

  return `${formatTime(diff, true)} ago`;
}

/**
 * Check if a date is in the future
 * @param {Date|number} date - Date to check
 * @returns {boolean}
 */
function isFuture(date) {
  const timestamp = date instanceof Date ? date.getTime() : date;
  return timestamp > Date.now();
}

/**
 * Check if a date is in the past
 * @param {Date|number} date - Date to check
 * @returns {boolean}
 */
function isPast(date) {
  const timestamp = date instanceof Date ? date.getTime() : date;
  return timestamp < Date.now();
}

/**
 * Add time to current date
 * @param {string} timeString - Time string (e.g., "1h", "30m")
 * @returns {Date|null}
 */
function addTime(timeString) {
  const milliseconds = parseTime(timeString);
  if (!milliseconds) return null;

  return new Date(Date.now() + milliseconds);
}

module.exports = {
  parseTime,
  formatTime,
  discordTimestamp,
  formatDuration,
  timeUntil,
  timeSince,
  isFuture,
  isPast,
  addTime,
};
