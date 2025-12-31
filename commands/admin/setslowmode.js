const { PermissionsBitField } = require('discord.js');
const { parseTime, formatTime } = require('../../utils/timeUtils');

module.exports = {
  name: 'setslowmode',
  description: 'Set slowmode for a channel',
  usage: '<duration> [#channel]',
  aliases: ['slowmode', 'ratelimit'],
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageChannels
      )
    ) {
      return message.reply('❌ You need Manage Channels permission!');
    }

    if (args.length === 0) {
      return message.reply(
        '❌ Usage: `setslowmode <duration> [#channel]`\n' +
          'Example: `setslowmode 10s` or `setslowmode 5m #general`'
      );
    }

    const channel =
      message.mentions.channels.first() || message.channel;

    if (!channel.isTextBased()) {
      return message.reply('❌ Channel must be a text channel!');
    }

    let seconds;
    if (args[0] === 'off' || args[0] === '0') {
      seconds = 0;
    } else {
      const duration = parseTime(args[0]);
      if (!duration) {
        return message.reply(
          '❌ Invalid duration! Use formats like: 10s, 5m, 1h'
        );
      }

      seconds = Math.floor(duration / 1000);

      if (seconds > 21600) {
        // Max 6 hours
        return message.reply('❌ Slowmode cannot exceed 6 hours!');
      }
    }

    try {
      await channel.setRateLimitPerUser(seconds);

      if (seconds === 0) {
        message.reply(`✅ Slowmode disabled in ${channel}!`);
      } else {
        message.reply(
          `✅ Slowmode set to **${formatTime(seconds * 1000, true)}** in ${channel}!`
        );
      }
    } catch (error) {
      console.error('Error setting slowmode:', error);
      message.reply('❌ Failed to set slowmode. Check my permissions!');
    }
  },
};
