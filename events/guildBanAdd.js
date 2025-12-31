const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    const settings = db.get('guild_settings', ban.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = ban.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Try to get who banned the user
    let executor = null;
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanAdd,
        limit: 1,
      });
      const banLog = auditLogs.entries.first();
      if (banLog) executor = banLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔨 Member Banned')
      .addFields(
        {
          name: 'User',
          value: `${ban.user.tag} (${ban.user.id})`,
          inline: true,
        },
        {
          name: 'Banned By',
          value: executor ? `${executor.tag}` : 'Unknown',
          inline: true,
        },
        {
          name: 'Reason',
          value: ban.reason || 'No reason provided',
          inline: false,
        }
      )
      .setThumbnail(ban.user.displayAvatarURL())
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
