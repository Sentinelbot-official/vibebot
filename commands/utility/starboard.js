const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setupstarboard',
  description: 'Setup starboard system',
  usage: '<#channel> [threshold]',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.reply('❌ You need Administrator permission!');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Please mention a channel!');
    }

    const threshold = parseInt(args[1]) || 5;
    if (threshold < 1 || threshold > 50) {
      return message.reply('❌ Threshold must be between 1 and 50!');
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    settings.starboard = {
      enabled: true,
      channelId: channel.id,
      threshold,
    };

    db.set('guild_settings', message.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('⭐ Starboard Setup Complete!')
      .setDescription(
        `Starboard channel: ${channel}\n` + `Threshold: ${threshold} ⭐`
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
