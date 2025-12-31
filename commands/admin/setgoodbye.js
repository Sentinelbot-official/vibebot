const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setgoodbye',
  description: 'Set goodbye message',
  usage: '<#channel> <message>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `setgoodbye <#channel> <message>`\n' +
          'Placeholders: `{user}` `{username}` `{server}` `{membercount}`\n' +
          'Example: `setgoodbye #goodbye Goodbye {username}! We now have {membercount} members.`'
      );
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Please mention a valid channel!');
    }

    const goodbyeMessage = args.slice(1).join(' ');

    const settings = db.get('guild_settings', message.guild.id) || {};
    settings.goodbye = {
      enabled: true,
      channelId: channel.id,
      message: goodbyeMessage,
    };

    db.set('guild_settings', message.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Goodbye Message Set!')
      .addFields(
        { name: 'Channel', value: channel.toString(), inline: true },
        { name: 'Message', value: goodbyeMessage, inline: false }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
