const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const settings = db.get('guild_settings', member.guild.id) || {};
    const goodbyeSettings = settings.goodbye || {};

    if (!goodbyeSettings.enabled || !goodbyeSettings.channelId) return;

    const channel = member.guild.channels.cache.get(goodbyeSettings.channelId);
    if (!channel) return;

    // Replace placeholders
    let message = goodbyeSettings.message || 'Goodbye {username}!';
    message = message
      .replace(/{user}/g, member.toString())
      .replace(/{username}/g, member.user.username)
      .replace(/{server}/g, member.guild.name)
      .replace(/{membercount}/g, member.guild.memberCount.toString());

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('👋 Goodbye!')
      .setDescription(message)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `Member count: ${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
