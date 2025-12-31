const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const settings = db.get('guild_settings', member.guild.id) || {};
    const welcomeSettings = settings.welcome || {};

    if (!welcomeSettings.enabled || !welcomeSettings.channelId) return;

    const channel = member.guild.channels.cache.get(welcomeSettings.channelId);
    if (!channel) return;

    // Replace placeholders
    let message = welcomeSettings.message || 'Welcome {user} to {server}!';
    message = message
      .replace(/{user}/g, member.toString())
      .replace(/{username}/g, member.user.username)
      .replace(/{server}/g, member.guild.name)
      .replace(/{membercount}/g, member.guild.memberCount.toString());

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('👋 Welcome!')
      .setDescription(message)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `Member #${member.guild.memberCount}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
