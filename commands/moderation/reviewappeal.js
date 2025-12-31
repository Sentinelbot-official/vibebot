const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const logger = require('../../utils/logger');

module.exports = {
  name: 'reviewappeal',
  aliases: ['appealreview', 'handleappeal'],
  description: 'Review and approve/deny a warning appeal',
  usage: '<case_id> <approve|deny> [reason]',
  category: 'moderation',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You need Moderate Members permission!');
    }

    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `//reviewappeal <case_id> <approve|deny> [reason]`\n\n' +
          '**Examples:**\n' +
          '• `//reviewappeal W1234567890-1234 approve Valid appeal`\n' +
          '• `//reviewappeal W1234567890-1234 deny Not sufficient evidence`\n\n' +
          '**Actions:**\n' +
          '• `approve` - Remove the warning and mark appeal as approved\n' +
          '• `deny` - Keep the warning and mark appeal as denied'
      );
    }

    const caseId = args[0];
    const action = args[1].toLowerCase();
    const reviewReason = args.slice(2).join(' ') || 'No reason provided';

    if (!['approve', 'deny'].includes(action)) {
      return message.reply('❌ Action must be either `approve` or `deny`!');
    }

    // Search for the case
    const allWarns = db.query(
      "SELECT * FROM kv_store WHERE collection = 'warns'"
    );

    let foundCase = null;
    let targetUserId = null;
    let allUserWarns = [];

    for (const row of allWarns) {
      try {
        const warns = JSON.parse(row.value);
        if (!Array.isArray(warns)) continue;

        const matchingWarn = warns.find(w => w.caseId === caseId);
        if (matchingWarn) {
          foundCase = matchingWarn;
          targetUserId = row.key;
          allUserWarns = warns;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!foundCase) {
      return message.reply(
        '❌ Case not found!\n\n' +
          '**Tip:** Use `//history @user` to see case IDs'
      );
    }

    if (!foundCase.appealed) {
      return message.reply(
        '❌ This case has not been appealed!\n\n' +
          `**Case ID:** \`${caseId}\`\n` +
          `**Status:** Not appealed\n\n` +
          '**Note:** Users can appeal warnings using `//appeal <case_id> <reason>`'
      );
    }

    if (foundCase.appealStatus && foundCase.appealStatus !== 'Pending') {
      return message.reply(
        `⚠️ This appeal has already been reviewed!\n\n` +
          `**Case ID:** \`${caseId}\`\n` +
          `**Status:** ${foundCase.appealStatus}\n` +
          `**Reviewed by:** ${foundCase.appealReviewer || 'Unknown'}\n` +
          `**Reviewed:** <t:${Math.floor((foundCase.appealReviewedAt || Date.now()) / 1000)}:R>\n\n` +
          '**Note:** Appeals can only be reviewed once'
      );
    }

    // Get user info
    const targetUser = await message.client.users
      .fetch(targetUserId)
      .catch(() => null);

    // Update the warning
    if (action === 'approve') {
      // Remove the warning (mark as inactive)
      foundCase.active = false;
      foundCase.appealStatus = 'Approved';
      foundCase.appealReviewer = message.author.tag;
      foundCase.appealReviewerId = message.author.id;
      foundCase.appealReviewedAt = Date.now();
      foundCase.appealReviewReason = reviewReason;
      foundCase.removedByAppeal = true;
    } else {
      // Deny the appeal (keep warning active)
      foundCase.appealStatus = 'Denied';
      foundCase.appealReviewer = message.author.tag;
      foundCase.appealReviewerId = message.author.id;
      foundCase.appealReviewedAt = Date.now();
      foundCase.appealReviewReason = reviewReason;
    }

    // Save updated warnings
    db.set('warns', targetUserId, allUserWarns);

    // Send confirmation to moderator
    const confirmEmbed = new EmbedBuilder()
      .setColor(action === 'approve' ? 0x00ff00 : 0xff0000)
      .setTitle(
        `${action === 'approve' ? '✅ Appeal Approved' : '❌ Appeal Denied'}`
      )
      .setDescription(
        `**Case ID:** \`${caseId}\`\n` +
          `**User:** ${targetUser ? targetUser.tag : 'Unknown'} (\`${targetUserId}\`)\n` +
          `**Action:** ${action === 'approve' ? 'Warning removed' : 'Warning kept active'}\n` +
          `**Reviewer:** ${message.author.tag}\n\u200b`
      )
      .addFields(
        {
          name: '📝 Original Warning',
          value: foundCase.reason || 'No reason provided',
          inline: false,
        },
        {
          name: '📬 Appeal Reason',
          value: foundCase.appealReason || 'No reason provided',
          inline: false,
        },
        {
          name: '⚖️ Review Decision',
          value: reviewReason,
          inline: false,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    await message.reply({ embeds: [confirmEmbed] });

    // Notify the user via DM
    if (targetUser) {
      try {
        const userEmbed = new EmbedBuilder()
          .setColor(action === 'approve' ? 0x00ff00 : 0xff0000)
          .setTitle(
            `${action === 'approve' ? '✅ Appeal Approved' : '❌ Appeal Denied'} - ${message.guild.name}`
          )
          .setDescription(
            `Your appeal for warning \`${caseId}\` has been reviewed.\n\u200b`
          )
          .addFields(
            {
              name: '📋 Case Information',
              value:
                `**Case ID:** \`${caseId}\`\n` +
                `**Server:** ${message.guild.name}\n` +
                `**Original Warning:** ${foundCase.reason || 'No reason provided'}`,
              inline: false,
            },
            {
              name: '📬 Your Appeal',
              value: foundCase.appealReason || 'No reason provided',
              inline: false,
            },
            {
              name: '⚖️ Decision',
              value:
                `**Status:** ${action === 'approve' ? '✅ Approved' : '❌ Denied'}\n` +
                `**Reviewer:** ${message.author.tag}\n` +
                `**Reason:** ${reviewReason}`,
              inline: false,
            }
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        if (action === 'approve') {
          userEmbed.addFields({
            name: '✅ Result',
            value:
              'Your warning has been removed from your record. Thank you for your patience!',
            inline: false,
          });
        } else {
          userEmbed.addFields({
            name: '❌ Result',
            value:
              'Your warning will remain on your record. If you have further concerns, please contact a server administrator.',
            inline: false,
          });
        }

        await targetUser.send({ embeds: [userEmbed] });
        logger.info(
          `Appeal review notification sent to ${targetUser.tag} for case ${caseId}`
        );
      } catch (error) {
        logger.warn(
          `Could not send appeal review DM to ${targetUser?.tag || targetUserId}`
        );
        await message.channel.send(
          `⚠️ Could not send DM notification to ${targetUser ? targetUser.tag : 'user'}. They may have DMs disabled.`
        );
      }
    }

    // Log to mod logs channel
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
      const logEmbed = new EmbedBuilder()
        .setColor(action === 'approve' ? 0x00ff00 : 0xff0000)
        .setTitle(`⚖️ Appeal Reviewed: ${caseId}`)
        .setDescription(
          `**User:** ${targetUser ? targetUser.tag : 'Unknown'} (\`${targetUserId}\`)\n` +
            `**Reviewer:** ${message.author.tag} (${message.author.id})\n` +
            `**Decision:** ${action === 'approve' ? '✅ Approved' : '❌ Denied'}\n` +
            `**Result:** ${action === 'approve' ? 'Warning removed' : 'Warning kept active'}`
        )
        .addFields(
          {
            name: '📝 Original Warning',
            value: foundCase.reason || 'No reason provided',
            inline: false,
          },
          {
            name: '📬 Appeal Reason',
            value: foundCase.appealReason || 'No reason provided',
            inline: false,
          },
          {
            name: '⚖️ Review Reason',
            value: reviewReason,
            inline: false,
          }
        )
        .setFooter({
          text: `Case ID: ${caseId}`,
        })
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    logger.info(
      `[APPEAL REVIEW] ${message.author.tag} ${action}d appeal for case ${caseId} (User: ${targetUserId})`
    );
  },
};
