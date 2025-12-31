const db = require('../utils/database');
const logger = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const settings = db.get('guild_settings', message.guild.id) || {};
    const aiMod = settings.aiModeration;

    if (!aiMod || !aiMod.enabled) return;

    // Skip if user has admin permissions
    if (message.member.permissions.has('Administrator')) return;

    try {
      const { analyzeToxicity } = require('../commands/admin/aimod');
      const result = await analyzeToxicity(message.content);

      if (result.isToxic && result.confidence >= aiMod.threshold) {
        logger.warn(
          `AI Moderation: Toxic message detected from ${message.author.tag}`
        );

        // Take action based on settings
        if (aiMod.action === 'delete') {
          await message.delete();
        }

        if (aiMod.action === 'timeout') {
          await message.member.timeout(
            5 * 60 * 1000,
            'AI Moderation: Toxic message'
          );
        }

        // Send warning to user
        try {
          await message.author.send(
            `⚠️ Your message in ${message.guild.name} was flagged by AI moderation for: ${result.categories.join(', ')}\n\n` +
              `Please follow the server rules and be respectful.`
          );
        } catch (err) {
          // User has DMs disabled
        }

        // Log to channel if set
        if (aiMod.logChannel) {
          const logChannel = message.guild.channels.cache.get(aiMod.logChannel);
          if (logChannel) {
            await logChannel.send(
              `🤖 **AI Moderation Alert**\n` +
                `User: ${message.author} (${message.author.tag})\n` +
                `Channel: ${message.channel}\n` +
                `Confidence: ${(result.confidence * 100).toFixed(1)}%\n` +
                `Categories: ${result.categories.join(', ')}\n` +
                `Action: ${aiMod.action}\n` +
                `Message: ||${message.content}||`
            );
          }
        }
      }
    } catch (error) {
      logger.error(`AI Moderation error: ${error.message}`);
    }
  },
};
