const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setlogs',
  description: 'Set server logs channel',
  usage: '<#channel>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, _args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return message.reply('❌ You need Administrator permission!');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Please mention a channel!');
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    settings.logChannelId = channel.id;
    db.set('guild_settings', message.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Server Logs Set!')
      .setDescription(`Server logs will be sent to ${channel}`)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
