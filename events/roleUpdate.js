const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    const settings = db.get('guild_settings', newRole.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = newRole.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Check what changed
    const changes = [];
    if (oldRole.name !== newRole.name) {
      changes.push(`**Name:** ${oldRole.name} → ${newRole.name}`);
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`**Color:** ${oldRole.hexColor} → ${newRole.hexColor}`);
    }
    if (oldRole.hoist !== newRole.hoist) {
      changes.push(
        `**Hoisted:** ${oldRole.hoist ? 'Yes' : 'No'} → ${newRole.hoist ? 'Yes' : 'No'}`
      );
    }
    if (oldRole.mentionable !== newRole.mentionable) {
      changes.push(
        `**Mentionable:** ${oldRole.mentionable ? 'Yes' : 'No'} → ${newRole.mentionable ? 'Yes' : 'No'}`
      );
    }
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      changes.push('**Permissions:** Updated');
    }

    if (changes.length === 0) return;

    // Try to get who updated the role
    let executor = null;
    try {
      const auditLogs = await newRole.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleUpdate,
        limit: 1,
      });
      const roleLog = auditLogs.entries.first();
      if (roleLog) executor = roleLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📝 Role Updated')
      .addFields(
        {
          name: 'Role',
          value: `${newRole.name} (${newRole.id})`,
          inline: true,
        },
        {
          name: 'Updated By',
          value: executor ? `${executor.tag}` : 'Unknown',
          inline: true,
        },
        {
          name: 'Changes',
          value: changes.join('\n'),
          inline: false,
        }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
