const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unban',
  description: 'Unban a user from the server',
  usage: '<user_id> [reason]',
  category: 'moderation',
  cooldown: 3,
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

    const userId = args[0];
    if (!userId) {
      return message.reply('❌ Usage: `unban <user_id> [reason]`');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      // Check if user is banned
      const bans = await message.guild.bans.fetch();
      const bannedUser = bans.get(userId);

      if (!bannedUser) {
        return message.reply('❌ This user is not banned!');
      }

      await message.guild.members.unban(userId, reason);
      message.reply(
        `✅ Unbanned **${bannedUser.user.tag}** (${userId})\nReason: ${reason}`
      );
    } catch (error) {
      console.error('Error unbanning user:', error);
      message.reply('❌ Failed to unban user! Make sure the user ID is valid.');
    }
  },
};
