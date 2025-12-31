const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild) {
    const settings = db.get('guild_settings', newGuild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = newGuild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    // Check what changed
    const changes = [];
    if (oldGuild.name !== newGuild.name) {
      changes.push(`**Name:** ${oldGuild.name} → ${newGuild.name}`);
    }
    if (oldGuild.icon !== newGuild.icon) {
      changes.push('**Icon:** Updated');
    }
    if (oldGuild.banner !== newGuild.banner) {
      changes.push('**Banner:** Updated');
    }
    if (oldGuild.splash !== newGuild.splash) {
      changes.push('**Invite Splash:** Updated');
    }
    if (oldGuild.description !== newGuild.description) {
      changes.push(
        `**Description:** ${oldGuild.description || 'None'} → ${newGuild.description || 'None'}`
      );
    }
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
      changes.push(
        `**Verification Level:** ${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`
      );
    }
    if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
      changes.push('**AFK Channel:** Updated');
    }
    if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
      changes.push('**System Channel:** Updated');
    }

    if (changes.length === 0) return;

    // Try to get who updated the guild
    let executor = null;
    try {
      const auditLogs = await newGuild.fetchAuditLogs({
        type: AuditLogEvent.GuildUpdate,
        limit: 1,
      });
      const guildLog = auditLogs.entries.first();
      if (guildLog) executor = guildLog.executor;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('🏰 Server Updated')
      .addFields(
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

    if (newGuild.iconURL()) {
      embed.setThumbnail(newGuild.iconURL());
    }

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
