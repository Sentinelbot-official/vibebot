const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'roleDelete',
  async execute(role) {
    const settings = db.get('guild_settings', role.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = role.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Try to get who deleted the role
    let executor = null;
    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 1,
      });
      const roleLog = auditLogs.entries.first();
      if (roleLog) executor = roleLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🗑️ Role Deleted')
      .addFields(
        {
          name: 'Role',
          value: `${role.name} (${role.id})`,
          inline: true,
        },
        {
          name: 'Deleted By',
          value: executor ? `${executor.tag}` : 'Unknown',
          inline: true,
        },
        {
          name: 'Color',
          value: role.hexColor,
          inline: true,
        }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
