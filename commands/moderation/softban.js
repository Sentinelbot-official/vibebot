const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'softban',
  description: 'Ban and immediately unban a member to delete their messages',
  usage: '<@member> [days] [reason]',
  category: 'moderation',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ You need Ban Members permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.BanMembers
      )
    ) {
      return message.reply('❌ I need Ban Members permission!');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('❌ Usage: `softban <@member> [days] [reason]`');
    }

    // Protection checks
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot softban yourself!');
    }

    if (member.id === message.guild.ownerId) {
      return message.reply('❌ You cannot softban the server owner!');
    }

    if (member.id === message.client.user.id) {
      return message.reply('❌ I cannot softban myself!');
    }

    if (
      message.member.roles.highest.position <= member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.reply(
        '❌ You cannot softban someone with an equal or higher role!'
      );
    }

    if (
      message.guild.members.me.roles.highest.position <=
      member.roles.highest.position
    ) {
      return message.reply(
        '❌ I cannot softban someone with an equal or higher role than me!'
      );
    }

    if (!member.bannable) {
      return message.reply('❌ I cannot softban this member!');
    }

    // Parse days and reason
    let days = 7;
    let reason = 'No reason provided';

    if (args[1] && !isNaN(args[1])) {
      days = Math.min(Math.max(parseInt(args[1]), 1), 7);
      reason = args.slice(2).join(' ') || reason;
    } else {
      reason = args.slice(1).join(' ') || reason;
    }

    try {
      // DM the user before banning
      try {
        await member.send(
          `You have been softbanned from **${message.guild.name}**\nReason: ${reason}\n\nYour messages from the last ${days} day(s) have been deleted. You can rejoin the server.`
        );
      } catch (error) {
        console.log('Could not DM user');
      }

      // Ban
      await member.ban({
        deleteMessageSeconds: days * 24 * 60 * 60,
        reason: `Softban by ${message.author.tag}: ${reason}`,
      });

      // Immediately unban
      await message.guild.members.unban(member.id, 'Softban - auto unban');

      message.reply(
        `✅ Softbanned **${member.user.tag}** (deleted ${days} day(s) of messages)\nReason: ${reason}`
      );
    } catch (error) {
      console.error('Error softbanning member:', error);
      message.reply('❌ Failed to softban member!');
    }
  },
};
