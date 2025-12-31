const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'emojiDelete',
  async execute(emoji) {
    const settings = db.get('guild_settings', emoji.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = emoji.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Try to get who deleted the emoji
    let executor = null;
    try {
      const auditLogs = await emoji.guild.fetchAuditLogs({
        type: AuditLogEvent.EmojiDelete,
        limit: 1,
      });
      const emojiLog = auditLogs.entries.first();
      if (emojiLog) executor = emojiLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🗑️ Emoji Deleted')
      .addFields(
        {
          name: 'Emoji',
          value: `\`:${emoji.name}:\` (${emoji.id})`,
          inline: true,
        },
        {
          name: 'Deleted By',
          value: executor ? `${executor.tag}` : 'Unknown',
          inline: true,
        }
      )
      .setThumbnail(emoji.url)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
