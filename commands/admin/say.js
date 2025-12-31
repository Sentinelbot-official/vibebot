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

    const text = args.join(' ');

    try {
      await message.delete();
      await message.channel.send(text);
    } catch (error) {
      console.error('Error sending message:', error);
      message.reply('❌ Failed to send message!');
    }
  },
};
