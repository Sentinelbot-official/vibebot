const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'clearwarns',
  description: 'Clear all warnings for a user',
  usage: '<@user>',
  aliases: ['clearwarnings', 'resetwarns'],
  category: 'moderation',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You need Manage Messages permission!');
    }

    const member =
      message.mentions.members.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null));

    if (!member) {
      return message.reply('❌ Usage: `clearwarns <@member>`');
    }

    const warns = db.get('warns', member.id);

    if (!warns || warns.length === 0) {
      return message.reply(`❌ ${member.user.tag} has no warnings!`);
    }

    const warnCount = warns.length;

    // Delete all warnings
    db.delete('warns', member.id);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Warnings Cleared')
      .setDescription(
        `Cleared **${warnCount}** warning(s) for ${member.user.tag}`
      )
      .addFields(
        {
          name: 'User',
          value: `${member.user.tag} (${member.id})`,
          inline: true,
        },
        {
          name: 'Cleared By',
          value: message.author.tag,
          inline: true,
        }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });

    // Try to DM the user
    try {
      await member.send(
        `✅ All your warnings in **${message.guild.name}** have been cleared.`
      );
    } catch (error) {
      // User has DMs disabled
    }
  },
};
