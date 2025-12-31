const automod = require('../utils/automod');
const db = require('../utils/database');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    // Get guild automod settings
    const settings = db.get('guild_settings', message.guild.id) || {};
    const automodSettings = settings.automod || { enabled: false };

    if (!automodSettings.enabled) return;

    // Check for spam
    if (automodSettings.antiSpam && automod.checkSpam(message)) {
      return automod.handleViolation(message, 'Stop spamming');
    }

    // Check for invite links
    if (automodSettings.antiInvites && automod.checkInvites(message)) {
      return automod.handleViolation(
        message,
        'Discord invites are not allowed'
      );
    }

    // Check for links (if not admin)
    if (
      automodSettings.antiLinks &&
      !message.member.permissions.has('ManageMessages')
    ) {
      if (automod.checkLinks(message)) {
        return automod.handleViolation(message, 'Links are not allowed');
      }
    }

    // Check for excessive caps
    if (automodSettings.antiCaps && automod.checkCaps(message)) {
      return automod.handleViolation(message, "Don't use excessive caps");
    }

    // Check for mass mentions
    if (automodSettings.antiMassMention && automod.checkMassMentions(message)) {
      return automod.handleViolation(message, "Don't mass mention");
    }
  },
};
