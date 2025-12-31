const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    const settings = db.get('guild_settings', role.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = role.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Try to get who created the role
    let executor = null;
    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleCreate,
        limit: 1,
      });
      const roleLog = auditLogs.entries.first();
      if (roleLog) executor = roleLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('📝 Role Created')
      .addFields(
        {
          name: 'Role',
          value: `${role.name} (${role.id})`,
          inline: true,
        },
        {
          name: 'Created By',
          value: executor ? `${executor.tag}` : 'Unknown',
          inline: true,
        },
        {
          name: 'Color',
          value: role.hexColor,
          inline: true,
        },
        {
          name: 'Hoisted',
          value: role.hoist ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: 'Mentionable',
          value: role.mentionable ? 'Yes' : 'No',
          inline: true,
        }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
