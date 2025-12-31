const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'lock',
  aliases: ['lockdown'],
  description: 'Lock a channel (prevent @everyone from sending messages)',
  usage: '[#channel] [reason]',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('❌ You need Manage Channels permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageChannels
      )
    ) {
      return message.reply('❌ I need Manage Channels permission!');
    }

    const channel = message.mentions.channels.first() || message.channel;
    const reason =
      args.slice(message.mentions.channels.first() ? 1 : 0).join(' ') ||
      'No reason provided';

    try {
      await channel.permissionOverwrites.edit(message.guild.id, {
        SendMessages: false,
      });

      message.reply(`🔒 ${channel} has been locked! Reason: ${reason}`);
    } catch (error) {
      console.error('Error locking channel:', error);
      message.reply('❌ Failed to lock channel!');
    }
  },
};
