const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const settings = db.get('guild_settings', member.guild.id) || {};
    const logChannel = settings.logChannelId;

    if (!logChannel) return;

    const channel = member.guild.channels.cache.get(logChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('📥 Member Joined')
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        {
          name: 'User',
          value: `${member.user.tag} (${member.id})`,
          inline: true,
        },
        {
          name: 'Account Created',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: 'Member Count',
          value: `${member.guild.memberCount}`,
          inline: true,
        }
      )
      .setTimestamp();

    channel.send({ embeds: [embed] }).catch(() => {});
  },
};

// Export additional events
module.exports.guildMemberRemove = async member => {
  const settings = db.get('guild_settings', member.guild.id) || {};
  const logChannel = settings.logChannelId;

  if (!logChannel) return;

  const channel = member.guild.channels.cache.get(logChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('📤 Member Left')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      {
        name: 'User',
        value: `${member.user.tag} (${member.id})`,
        inline: true,
      },
      {
        name: 'Joined',
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
        inline: true,
      },
      {
        name: 'Member Count',
        value: `${member.guild.memberCount}`,
        inline: true,
      }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] }).catch(() => {});
};
