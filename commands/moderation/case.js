const {
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'case',
  aliases: ['modcase', 'caseinfo'],
  description: 'View detailed information about a moderation case',
  usage: '<case_id>',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You need Moderate Members permission!');
    }

    if (!args[0]) {
      return message.reply(
        '❌ Usage: `case <case_id>`\n\n' +
          '**Example:** `//case W1735689600000-1234`\n' +
          '**Tip:** Use `//history @user` to see all case IDs'
      );
    }

    const caseId = args[0];

    // Search through all warns to find the case
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
          '**Possible reasons:**\n' +
          '• Case ID is incorrect\n' +
          '• Case was deleted\n' +
          '• Case is from a different server\n\n' +
          '**Tip:** Use `//history @user` to see valid case IDs'
      );
    }

    const targetUser = await message.client.users
      .fetch(targetUserId)
      .catch(() => null);
    const moderator = await message.client.users
      .fetch(foundCase.moderator?.id || foundCase.moderator)
      .catch(() => null);

    // Calculate user's warning statistics
    const activeWarns = allUserWarns.filter(w => w.active !== false).length;
    const totalWarns = allUserWarns.length;
    const decayedWarns = allUserWarns.filter(w => w.active === false).length;

    // Determine case status
    const statusParts = [];
    if (foundCase.active === false) {
      statusParts.push('🔵 Decayed');
    } else {
      statusParts.push('🔴 Active');
    }

    if (foundCase.appealed) {
      statusParts.push(
        `⚠️ Appealed (${foundCase.appealStatus || 'Pending'})`
      );
    }

    const status = statusParts.join(' | ');

    // Calculate time since warning
    const timeSince = Date.now() - (foundCase.timestamp || Date.now());
    const daysAgo = Math.floor(timeSince / (1000 * 60 * 60 * 24));

    const embed = new EmbedBuilder()
      .setColor(foundCase.active === false ? 0x808080 : 0xff9900)
      .setTitle(`📋 Case Details: ${caseId}`)
      .setDescription(
        `**Status:** ${status}\n` +
          `**Server:** ${message.guild.name}\n` +
          `**Days Since Warning:** ${daysAgo} days\n\u200b`
      )
      .addFields(
        {
          name: '👤 Warned User',
          value: targetUser
            ? `${targetUser.tag}\n\`${targetUserId}\``
            : `Unknown User\n\`${targetUserId}\``,
          inline: true,
        },
        {
          name: '👮 Moderator',
          value: moderator
            ? `${moderator.tag}\n\`${moderator.id}\``
            : `Unknown\n\`${foundCase.moderator?.id || 'N/A'}\``,
          inline: true,
        },
        {
          name: '📅 Issued',
          value: `<t:${Math.floor((foundCase.timestamp || Date.now()) / 1000)}:F>\n<t:${Math.floor((foundCase.timestamp || Date.now()) / 1000)}:R>`,
          inline: true,
        },
        {
          name: '📝 Reason',
          value:
            (foundCase.reason || 'No reason provided').substring(0, 1000) +
            (foundCase.reason?.length > 1000 ? '...' : ''),
          inline: false,
        },
        {
          name: '📊 User Statistics',
          value:
            `**Active Warnings:** ${activeWarns}\n` +
            `**Total Warnings:** ${totalWarns}\n` +
            `**Decayed Warnings:** ${decayedWarns}`,
          inline: true,
        },
        {
          name: '🔍 Case Info',
          value:
            `**Channel:** <#${foundCase.channel || 'Unknown'}>\n` +
            `**Guild ID:** \`${foundCase.guildId || message.guild.id}\`\n` +
            `**Case Type:** Warning`,
          inline: true,
        }
      )
      .setFooter({
        text: `Case ID: ${caseId} | Use //history @user for full history`,
      })
      .setTimestamp(foundCase.timestamp || Date.now());

    if (targetUser) {
      embed.setThumbnail(targetUser.displayAvatarURL());
    }

    // Add appeal information if appealed
    if (foundCase.appealed) {
      embed.addFields({
        name: '📬 Appeal Information',
        value:
          `**Appeal Reason:** ${foundCase.appealReason || 'Not provided'}\n` +
          `**Appeal Status:** ${foundCase.appealStatus || 'Pending'}\n` +
          `**Appealed:** <t:${Math.floor((foundCase.appealedAt || Date.now()) / 1000)}:R>`,
        inline: false,
      });
    }

    // Add decay information if decayed
    if (foundCase.active === false && foundCase.decayedAt) {
      embed.addFields({
        name: '⏰ Decay Information',
        value:
          `**Decayed:** <t:${Math.floor(foundCase.decayedAt / 1000)}:R>\n` +
          `**Reason:** Warning older than 90 days\n` +
          `**Note:** Decayed warnings don't count toward auto-moderation`,
        inline: false,
      });
    }

    // Add action buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`viewuser_${targetUserId}`)
        .setLabel('View User History')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋'),
      new ButtonBuilder()
        .setLabel('View User Profile')
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/users/${targetUserId}`
        )
        .setEmoji('👤')
    );

    const reply = await message.reply({ embeds: [embed], components: [row] });

    // Handle button interactions
    const collector = reply.createMessageComponentCollector({
      time: 300000, // 5 minutes
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: '❌ Only the command user can use these buttons!',
          ephemeral: true,
        });
      }

      if (interaction.customId.startsWith('viewuser_')) {
        // Redirect to history command
        await interaction.reply({
          content: `📋 Use \`//history <@${targetUserId}>\` to view full history`,
          ephemeral: true,
        });
      }
    });

    collector.on('end', () => {
      reply
        .edit({
          components: [],
        })
        .catch(() => {});
    });
  },
};
