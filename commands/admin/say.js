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

    // Prevent @everyone/@here abuse unless user has permission
    if (!message.member.permissions.has(PermissionFlagsBits.MentionEveryone)) {
      text = text
        .replace(/@everyone/gi, '@\u200beveryone')
        .replace(/@here/gi, '@\u200bhere');
    }

    // Sanitize role mentions if user doesn't have permission
    if (!message.member.permissions.has(PermissionFlagsBits.MentionEveryone)) {
      // Replace role mentions with zero-width space
      text = text.replace(/<@&\d+>/g, match => {
        return match.replace('@', '@\u200b');
      });
    }

    try {
      await message.delete();
      await message.channel.send({
        content: text,
        allowedMentions: {
          parse: message.member.permissions.has(
            PermissionFlagsBits.MentionEveryone
          )
            ? ['everyone', 'roles', 'users']
            : ['users'],
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
      message.reply('❌ Failed to send message!');
    }
  },
};
