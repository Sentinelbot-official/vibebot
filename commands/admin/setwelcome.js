const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'setwelcome',
  description: 'Set welcome message',
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
        '❌ Usage: `setwelcome <#channel> <message>`\n' +
          'Placeholders: `{user}` `{username}` `{server}` `{membercount}`\n' +
          'Example: `setwelcome #welcome Welcome {user} to {server}! You are member #{membercount}!`'
      );
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Please mention a valid channel!');
    }

    const welcomeMessage = args.slice(1).join(' ');

    const settings = db.get('guild_settings', message.guild.id) || {};
    settings.welcome = {
      enabled: true,
      channelId: channel.id,
      message: welcomeMessage,
    };

    db.set('guild_settings', message.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.success)
      .setTitle('✅ Welcome Message Set!')
      .addFields(
        { name: 'Channel', value: channel.toString(), inline: true },
        { name: 'Message', value: welcomeMessage, inline: false }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
