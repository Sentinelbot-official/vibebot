const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'unmute',
  description: 'Unmute a member (remove timeout)',
  usage: '<@member>',
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
      return message.reply('❌ Usage: `!unmute <@member>`');
    }

    try {
      if (!member.communicationDisabledUntil) {
        return message.reply('❌ This member is not muted!');
      }

      await member.timeout(null, `Unmuted by ${message.author.tag}`);
      message.reply(`✅ Unmuted ${member}!`);

      // DM the user
      try {
        await member.send(`You have been unmuted in **${message.guild.name}**`);
      } catch (error) {
        console.log('Could not DM user');
      }
    } catch (error) {
      console.error('Error unmuting member:', error);
      message.reply('❌ Failed to unmute member!');
    }
  },
};
