const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'case',
  aliases: ['modcase', 'caseinfo'],
  description: 'View detailed information about a moderation case',
  usage: '<case_id>',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
    ) {
      return message.reply('❌ You need Moderate Members permission!');
    }

    if (!args[0]) {
      return message.reply('❌ Usage: `case <case_id>`');
    }

    const caseId = args[0];

    // Search through all warns to find the case
    const allWarns = db.query(
      'SELECT * FROM kv_store WHERE key LIKE "warns:%"'
    );

    let foundCase = null;
    let targetUserId = null;

    for (const row of allWarns) {
      try {
        const warns = JSON.parse(row.value);
        const matchingWarn = warns.find(w => w.caseId === caseId);
        if (matchingWarn) {
          foundCase = matchingWarn;
          targetUserId = row.key.split(':')[1];
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!foundCase) {
      return message.reply('❌ Case not found!');
    }

    const targetUser = await message.client.users
      .fetch(targetUserId)
      .catch(() => null);
    const moderator = await message.client.users
      .fetch(foundCase.moderator)
      .catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle(`📋 Case #${caseId}`)
      .addFields(
        {
          name: '👤 User',
          value: targetUser
            ? `${targetUser.tag} (${targetUserId})`
            : `Unknown User (${targetUserId})`,
          inline: true,
        },
        {
          name: '👮 Moderator',
          value: moderator ? `${moderator.tag}` : 'Unknown',
          inline: true,
        },
        {
          name: '📅 Date',
          value: `<t:${Math.floor(foundCase.timestamp / 1000)}:F>`,
          inline: true,
        },
        {
          name: '📝 Reason',
          value: foundCase.reason || 'No reason provided',
          inline: false,
        },
        {
          name: '⚠️ Warning Count',
          value: `This was warning #${foundCase.count || 1}`,
          inline: true,
        }
      )
      .setFooter({ text: `Case ID: ${caseId}` })
      .setTimestamp(foundCase.timestamp);

    message.reply({ embeds: [embed] });
  },
};
