const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban) {
    const settings = db.get('guild_settings', ban.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = ban.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Try to get who unbanned the user
    let executor = null;
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanRemove,
        limit: 1,
      });
      const unbanLog = auditLogs.entries.first();
      if (unbanLog) executor = unbanLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Member Unbanned')
      .addFields(
        {
          name: 'User',
          value: `${ban.user.tag} (${ban.user.id})`,
          inline: true,
        },
        {
          name: 'Unbanned By',
          value: executor ? `${executor.tag}` : 'Unknown',
          inline: true,
        }
      )
      .setThumbnail(ban.user.displayAvatarURL())
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
