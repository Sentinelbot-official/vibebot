const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'say',
  aliases: ['echo'],
  description: 'Make the bot say something',
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

    let text = args.join(' ');

    // Validate message length
    if (text.length > 2000) {
      return message.reply('❌ Message is too long! Maximum 2000 characters.');
    }

    // Sanitize ALL mentions to prevent pings (for everyone, including admins)
    text = text
      .replace(/@everyone/gi, '@\u200beveryone')
      .replace(/@here/gi, '@\u200bhere');

    // Sanitize user mentions
    text = text.replace(/<@!?\d+>/g, match => {
      return match.replace('@', '@\u200b');
    });

    // Sanitize role mentions
    text = text.replace(/<@&\d+>/g, match => {
      return match.replace('@', '@\u200b');
    });

    try {
      // Add attribution footer to show who used the command
      const footer = `\n\n-# Sent by ${message.author.tag} via say command`;
      const fullMessage = text + footer;

      await message.delete();
      await message.channel.send({
        content: fullMessage,
        allowedMentions: {
          // Disable ALL pings for everyone
          parse: [],
          users: [],
          roles: [],
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
      message.reply('❌ Failed to send message!');
    }
  },
};
