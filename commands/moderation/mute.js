const { PermissionsBitField } = require('discord.js');
const ms = require('ms');

module.exports = {
  name: 'mute',
  description: 'Mute a member using Discord timeout',
  usage: '<@member> <duration> [reason]',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    ) {
      return message.reply('❌ You need Moderate Members permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    ) {
      return message.reply('❌ I need Moderate Members permission!');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('❌ Usage: `!mute <@member> <duration> [reason]`');
    }

    if (!args[1]) {
      return message.reply('❌ Please provide a duration! (e.g., 10m, 1h, 1d)');
    }

    // Protection checks
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot mute yourself!');
    }

    if (member.id === message.guild.ownerId) {
      return message.reply('❌ You cannot mute the server owner!');
    }

    if (member.id === message.client.user.id) {
      return message.reply('❌ I cannot mute myself!');
    }

    if (
      message.member.roles.highest.position <= member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.reply(
        '❌ You cannot mute someone with an equal or higher role!'
      );
    }

    if (
      message.guild.members.me.roles.highest.position <=
      member.roles.highest.position
    ) {
      return message.reply(
        '❌ I cannot mute someone with an equal or higher role than me!'
      );
    }

    // Parse duration
    const duration = ms(args[1]);
    if (!duration || duration > 2419200000) {
      // 28 days max
      return message.reply(
        '❌ Invalid duration! Must be between 1 minute and 28 days. (e.g., 10m, 1h, 1d)'
      );
    }

    const reason = args.slice(2).join(' ') || 'No reason provided';

    try {
      await member.timeout(duration, reason);

      const durationText = ms(duration, { long: true });
      message.reply(
        `✅ Muted ${member} for **${durationText}**\nReason: ${reason}`
      );

      // DM the user
      try {
        await member.send(
          `You have been muted in **${message.guild.name}** for **${durationText}**\nReason: ${reason}`
        );
      } catch (error) {
        console.log('Could not DM user');
      }
    } catch (error) {
      console.error('Error muting member:', error);
      message.reply('❌ Failed to mute member!');
    }
  },
};
