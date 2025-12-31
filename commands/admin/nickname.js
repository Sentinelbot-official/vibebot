const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'nickname',
  description: "Change a user's nickname",
  usage: '<@user> <nickname|reset>',
  aliases: ['setnick', 'changenick'],
  category: 'admin',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageNicknames)
    ) {
      return message.reply('❌ You need Manage Nicknames permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageNicknames
      )
    ) {
      return message.reply('❌ I need Manage Nicknames permission!');
    }

    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `nickname <@user> <nickname|reset>`\n' +
          'Use "reset" to remove the nickname.'
      );
    }

    const member =
      message.mentions.members.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null));

    if (!member) {
      return message.reply('❌ Please mention a valid member!');
    }

    if (member.id === message.guild.ownerId) {
      return message.reply("❌ I cannot change the server owner's nickname!");
    }

    if (
      member.roles.highest.position >=
      message.guild.members.me.roles.highest.position
    ) {
      return message.reply(
        '❌ I cannot change the nickname of this user (role hierarchy)!'
      );
    }

    if (
      member.roles.highest.position >= message.member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.reply(
        '❌ You cannot change the nickname of this user (role hierarchy)!'
      );
    }

    const oldNickname = member.nickname || member.user.username;
    const newNickname = args.slice(1).join(' ');

    let finalNickname;
    if (newNickname.toLowerCase() === 'reset') {
      finalNickname = null;
    } else {
      if (newNickname.length > 32) {
        return message.reply('❌ Nickname cannot exceed 32 characters!');
      }
      finalNickname = newNickname;
    }

    try {
      await member.setNickname(finalNickname);

      message.reply(
        `✅ Changed ${member.user.tag}'s nickname!\n` +
          `**Old:** ${oldNickname}\n` +
          `**New:** ${finalNickname || member.user.username}`
      );
    } catch (error) {
      console.error('Error changing nickname:', error);
      message.reply('❌ Failed to change nickname!');
    }
  },
};
