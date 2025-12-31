const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'say',
  aliases: ['echo'],
  description: 'Make the bot say something in an embed',
  usage: '<message>',
  category: 'admin',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You need Manage Messages permission!');
    }

    if (!args.length) {
      return message.reply('❌ Please provide a message!');
    }

    const text = args.join(' ');

    // Validate message length (embeds have 4096 char limit for description)
    if (text.length > 4000) {
      return message.reply('❌ Message is too long! Maximum 4000 characters.');
    }

    try {
      const embed = new EmbedBuilder()
        .setDescription(text)
        .setColor(0x5865f2)
        .setFooter({
          text: `Sent by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      await message.delete();
      await message.channel.send({ embeds: [embed] });
    } catch (error) {
      const logger = require('../../utils/logger');
const branding = require('../../utils/branding');
      logger.error('Error sending message:', error);
      message.reply('❌ Failed to send message!');
    }
  },
};
