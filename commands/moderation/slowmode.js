const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'slowmode',
  aliases: ['slow', 'sm'],
  description: 'Set channel slowmode',
  usage: '<seconds> [#channel]',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageChannels)
    ) {
      return message.reply('❌ You need Manage Channels permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageChannels
      )
    ) {
      return message.reply('❌ I need Manage Channels permission!');
    }

    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return message.reply(
        '❌ Please provide a valid number between 0 and 21600 seconds (6 hours)!'
      );
    }

    const channel = message.mentions.channels.first() || message.channel;

    try {
      await channel.setRateLimitPerUser(seconds);

      if (seconds === 0) {
        message.reply(`✅ Slowmode disabled in ${channel}!`);
      } else {
        const formatted =
          seconds >= 60
            ? `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''}`
            : `${seconds} second${seconds > 1 ? 's' : ''}`;
        message.reply(`✅ Slowmode set to **${formatted}** in ${channel}!`);
      }
    } catch (error) {
      console.error('Error setting slowmode:', error);
      message.reply('❌ Failed to set slowmode!');
    }
  },
};
