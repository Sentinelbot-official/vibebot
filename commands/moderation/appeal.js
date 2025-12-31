const db = require('../../utils/database');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'appeal',
  description: 'Appeal a warning',
  usage: '<case_id> <reason>',
  aliases: ['appealwarn', 'warnapeal'],
  category: 'moderation',
  cooldown: 60,
  guildOnly: true,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a case ID and reason!\n\n' +
          '**Usage:** `//appeal <case_id> <reason>`\n' +
          '**Example:** `//appeal W1234567890-1234 I was wrongly accused`'
      );
    }

    const caseId = args[0];
    const appealReason = args.slice(1).join(' ');

    if (!appealReason) {
      return message.reply('❌ Please provide a reason for your appeal!');
    }

    if (appealReason.length > 500) {
      return message.reply('❌ Appeal reason must be 500 characters or less!');
    }

    // Get user's warnings
    const warns = db.get('warns', message.author.id) || [];
    const warning = warns.find(w => w.caseId === caseId);

    if (!warning) {
      return message.reply(
        `❌ Warning with case ID \`${caseId}\` not found!\n\n` +
          'Use `//warnings` to see your warnings and their case IDs.'
      );
    }

    // Check if warning is from this server
    if (warning.guildId !== message.guild.id) {
      return message.reply('❌ This warning is from a different server!');
    }

    // Check if already appealed
    if (warning.appealed) {
      return message.reply(
        `❌ This warning has already been appealed!\n\n` +
          `**Status:** ${warning.appealStatus || 'Pending'}\n` +
          `**Appealed:** <t:${Math.floor(warning.appealedAt / 1000)}:R>`
      );
    }

    // Check if warning is too old (can't appeal after 180 days)
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
    if (warning.timestamp < sixMonthsAgo) {
      return message.reply(
        '❌ This warning is too old to appeal (180+ days)!\n\n' +
          'Warnings older than 180 days cannot be appealed.'
      );
    }

    // Mark as appealed
    warning.appealed = true;
    warning.appealReason = appealReason;
    warning.appealedAt = Date.now();
    warning.appealStatus = 'Pending';
    db.set('warns', message.author.id, warns);

    // Send confirmation to user
    const userEmbed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📝 Warning Appeal Submitted')
      .setDescription(
        `Your appeal for warning \`${caseId}\` has been submitted and is pending review.`
      )
      .addFields(
        { name: 'Original Warning', value: warning.reason, inline: false },
        { name: 'Appeal Reason', value: appealReason, inline: false },
        { name: 'Status', value: '⏳ Pending Review', inline: true },
        {
          name: 'Submitted',
          value: '<t:${Math.floor(Date.now() / 1000)}:R>',
          inline: true,
        }
      )
      .setFooter({ text: 'Moderators will review your appeal shortly' })
      .setTimestamp();

    await message.reply({ embeds: [userEmbed] });

    // Notify moderators
    const logChannel = message.guild.channels.cache.find(
      ch =>
        ch.name === 'mod-logs' ||
        ch.name === 'logs' ||
        (ch.type === 0 && (ch.name.includes('mod') || ch.name.includes('log')))
    );

    if (
      logChannel &&
      logChannel
        .permissionsFor(message.guild.members.me)
        .has(PermissionFlagsBits.SendMessages)
    ) {
      const modEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('📝 New Warning Appeal')
        .setDescription(
          `**User:** ${message.author.tag} (${message.author.id})\n` +
            `**Case ID:** \`${caseId}\``
        )
        .addFields(
          { name: 'Original Warning', value: warning.reason, inline: false },
          {
            name: 'Original Moderator',
            value: warning.moderator.tag,
            inline: true,
          },
          {
            name: 'Warning Date',
            value: `<t:${Math.floor(new Date(warning.date).getTime() / 1000)}:R>`,
            inline: true,
          },
          { name: 'Appeal Reason', value: appealReason, inline: false }
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({
          text: `Use //reviewappeal ${caseId} <approve|deny> [reason]`,
        })
        .setTimestamp();

      await logChannel.send({ embeds: [modEmbed] }).catch(() => {});
    }

    // Log the appeal
    const logger = require('../../utils/logger');
    logger.info(
      `[APPEAL] ${message.author.tag} appealed warning ${caseId}: ${appealReason}`
    );
  },
};
