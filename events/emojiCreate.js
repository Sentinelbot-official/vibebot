const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'emojiCreate',
  async execute(emoji) {
    const settings = db.get('guild_settings', emoji.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = emoji.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Try to get who created the emoji
    let executor = null;
    try {
      const auditLogs = await emoji.guild.fetchAuditLogs({
        type: AuditLogEvent.EmojiCreate,
        limit: 1,
      });
      const emojiLog = auditLogs.entries.first();
      if (emojiLog) executor = emojiLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('😀 Emoji Created')
      .addFields(
        {
          name: 'Emoji',
          value: `${emoji} \`:${emoji.name}:\``,
          inline: true,
        },
        {
          name: 'Created By',
          value: executor ? `${executor.tag}` : 'Unknown',
          inline: true,
        },
        {
          name: 'Animated',
          value: emoji.animated ? 'Yes' : 'No',
          inline: true,
        }
      )
      .setThumbnail(emoji.url)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
