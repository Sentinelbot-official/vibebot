const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unlock',
  description: 'Unlock a channel (allow @everyone to send messages)',
  usage: '[#channel]',
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

    try {
      await channel.permissionOverwrites.edit(message.guild.id, {
        SendMessages: null, // Reset to default
      });

      message.reply(`🔓 ${channel} has been unlocked!`);
    } catch (error) {
      console.error('Error unlocking channel:', error);
      message.reply('❌ Failed to unlock channel!');
    }
  },
};
