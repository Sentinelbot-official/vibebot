const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'nick',
  aliases: ['nickname', 'setnick'],
  description: "Change a member's nickname",
  usage: '<@member> <nickname>',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return message.reply('❌ You need Manage Nicknames permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageNicknames
      )
    ) {
      return message.reply('❌ I need Manage Nicknames permission!');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('❌ Usage: `nick <@member> <nickname>`');
    }

    const nickname = args.slice(1).join(' ');
    if (!nickname) {
      return message.reply(
        '❌ Please provide a nickname! (Use "reset" to remove nickname)'
      );
    }

    // Check if trying to change bot owner
    if (member.id === message.guild.ownerId) {
      return message.reply("❌ I cannot change the server owner's nickname!");
    }

    // Check role hierarchy
    if (
      message.member.roles.highest.position <= member.roles.highest.position &&
      message.author.id !== message.guild.ownerId
    ) {
      return message.reply(
        '❌ You cannot change the nickname of someone with an equal or higher role!'
      );
    }

    if (
      message.guild.members.me.roles.highest.position <=
      member.roles.highest.position
    ) {
      return message.reply(
        '❌ I cannot change the nickname of someone with an equal or higher role than me!'
      );
    }

    try {
      const newNick = nickname.toLowerCase() === 'reset' ? null : nickname;
      await member.setNickname(newNick);

      if (newNick) {
        message.reply(`✅ Changed ${member}'s nickname to **${newNick}**`);
      } else {
        message.reply(`✅ Reset ${member}'s nickname`);
      }
    } catch (error) {
      console.error('Error changing nickname:', error);
      message.reply('❌ Failed to change nickname!');
    }
  },
};
