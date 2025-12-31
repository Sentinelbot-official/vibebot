const db = require('../../utils/database');
const branding = require('../../utils/branding');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'removewarn',
  description: 'Remove a warning from a member',
  usage: '<@member> <caseId>',
  category: 'moderation',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You do not have permission to remove warnings.');
    }

    // Get member
    const member =
      message.mentions.members.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null));

    if (!member) {
      return message.reply(
        '❌ Please mention a member or provide a valid user ID.'
      );
    }

    // Get case ID
    const caseId = args[1];
    if (!caseId) {
      return message.reply('❌ Please provide a case ID to remove.');
    }

    // Get warnings
    const warns = db.get('warns', member.id) || [];

    if (warns.length === 0) {
      return message.reply('❌ This member has no warnings.');
    }

    // Find the warning with the case ID
    const warnIndex = warns.findIndex(w => w.caseId === caseId);

    if (warnIndex === -1) {
      return message.reply(
        `❌ This member does not have a warning with case ID: ${caseId}`
      );
    }

    // Get the warning before removing it
    const removedWarn = warns[warnIndex];

    // Remove the warning
    warns.splice(warnIndex, 1);

    // Update database
    if (warns.length === 0) {
      db.delete('warns', member.id);
    } else {
      db.set('warns', member.id, warns);
    }

    // Send confirmation embed
    const embed = new EmbedBuilder()
      .setColor(branding.colors.success)
      .setTitle('✅ Warning Removed')
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: '👤 Member', value: `${member.user.tag}`, inline: true },
        { name: '🆔 Case ID', value: caseId, inline: true },
        {
          name: '📝 Original Reason',
          value: removedWarn.reason,
          inline: false,
        },
        {
          name: '👮 Original Moderator',
          value: removedWarn.moderator.tag,
          inline: true,
        },
        {
          name: '📅 Original Date',
          value: new Date(removedWarn.date).toLocaleString(),
          inline: true,
        },
        {
          name: '🗑️ Removed By',
          value: `${message.author.tag}`,
          inline: true,
        },
        {
          name: '⚖️ Remaining Warnings',
          value: `${warns.length}`,
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Try to DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`Warning removed in ${message.guild.name}`)
        .setColor(branding.colors.success)
        .addFields(
          { name: 'Case ID', value: caseId },
          { name: 'Removed By', value: message.author.tag },
          { name: 'Remaining Warnings', value: warns.length.toString() }
        )
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled
    }
  },
};
