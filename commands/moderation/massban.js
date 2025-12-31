const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'massban',
  aliases: ['banlist', 'multiban'],
  description: 'Ban multiple users by ID (space-separated)',
  usage: '<user_id1> <user_id2> ... [reason]',
  category: 'moderation',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ You need Ban Members permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.BanMembers
      )
    ) {
      return message.reply('❌ I need Ban Members permission!');
    }

    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `massban <user_id1> <user_id2> ... [reason]`'
      );
    }

    // Parse user IDs and reason
    const userIds = [];
    let reason = 'Mass ban';

    for (let i = 0; i < args.length; i++) {
      if (/^\d{17,19}$/.test(args[i])) {
        userIds.push(args[i]);
      } else {
        reason = args.slice(i).join(' ');
        break;
      }
    }

    if (userIds.length === 0) {
      return message.reply('❌ No valid user IDs provided!');
    }

    if (userIds.length > 10) {
      return message.reply('❌ You can only ban up to 10 users at once!');
    }

    const msg = await message.reply(`⏳ Banning ${userIds.length} user(s)...`);

    let banned = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await message.guild.members.ban(userId, {
          reason: `Mass ban by ${message.author.tag}: ${reason}`,
        });
        banned++;
      } catch (error) {
        console.error(`Failed to ban ${userId}:`, error);
        failed++;
      }
    }

    msg.edit(
      `✅ Mass ban complete!\nBanned: **${banned}**\nFailed: **${failed}**\nReason: ${reason}`
    );
  },
};
