const db = require('../../utils/database');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'warn',
  description:
    'Warn a member in the server with tracking, escalation, and DM notification.',
  usage: '<@member> <reason>',
  category: 'moderation',
  async execute(message, args) {
    // Permissions and input checks
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return message.reply('❌ You do not have permission to warn members.');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply(
        'Please mention a member to warn. Usage: `warn @user <reason>`'
      );
    }

    if (member.user.bot) {
      return message.reply('You cannot warn bots.');
    }

    if (member.id === message.author.id) {
      return message.reply('You cannot warn yourself.');
    }

    if (member.id === message.guild.ownerId) {
      return message.reply('You cannot warn the server owner.');
    }

    if (
      member.roles.highest.position >= message.member.roles.highest.position &&
      message.guild.ownerId !== message.author.id
    ) {
      return message.reply(
        'You cannot warn this member due to role hierarchy.'
      );
    }

    // Grab reason
    const reason = args.slice(1).join(' ') || 'No reason provided';

    // Store the warning in the database
    const warnData = {
      moderator: {
        id: message.author.id,
        tag: message.author.tag,
      },
      reason: reason,
      date: new Date().toISOString(),
      channel: message.channel.id,
      caseId: `W${Date.now()}-${member.id.slice(-4)}`, // Timestamp-based case ID
    };

    await db.push('warns', member.id, warnData);

    // Advanced: Count warns and check for escalation thresholds
    const warns = db.get('warns', member.id) || [];
    const warnCount = warns.length;

    // Escalation logic: Example thresholds/actions
    let actionTaken = null;
    if (warnCount === 3) {
      // Timeout for 30 minutes
      if (member.moderatable && member.timeout) {
        await member
          .timeout(30 * 60 * 1000, 'Reached 3 warnings')
          .catch(() => {});
        actionTaken = 'Timed out for 30 minutes (auto action)';
      }
    } else if (warnCount === 5) {
      // Kick
      if (member.kickable) {
        await member.kick('Reached 5 warnings').catch(() => {});
        actionTaken = 'Kicked from server (auto action)';
      }
    }

    // Send DM to warned user (ignore errors if DMs closed)
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You have been warned in ${message.guild.name}`)
        .setColor(0xffc300)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: message.author.tag },
          { name: 'Warn Count', value: warnCount.toString() },
          { name: 'Date', value: new Date().toLocaleString() }
        )
        .setFooter({ text: `Case ID: ${warnData.caseId}` })
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] });
    } catch {}

    // Logging embed sent to moderation logs (if desired)
    const logChannel = message.guild.channels.cache.find(
      ch =>
        ch.name === 'mod-logs' ||
        ch.name === 'logs' ||
        (ch.type === 0 && (ch.name.includes('mod') || ch.name.includes('log')))
    );
    const logEmbed = new EmbedBuilder()
      .setColor(0xffc300)
      .setAuthor({
        name: `${member.user.tag} (${member.id}) warned`,
        iconURL: member.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: 'Moderator',
          value: `${message.author.tag} (${message.author.id})`,
          inline: false,
        },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Warn Count', value: warnCount.toString(), inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Date', value: new Date().toLocaleString(), inline: false },
        { name: 'Case ID', value: warnData.caseId, inline: false }
      )
      .setTimestamp();
    if (
      logChannel &&
      logChannel
        .permissionsFor(message.guild.members.me)
        .has(PermissionFlagsBits.SendMessages)
    ) {
      logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    // Public feedback
    const publicEmbed = new EmbedBuilder()
      .setColor(
        warnCount >= 5 ? 0xff0000 : warnCount >= 3 ? 0xffa500 : 0x0099ff
      )
      .setTitle(`Warned ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Warn Count', value: warnCount.toString(), inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Date', value: new Date().toLocaleString(), inline: false }
      )
      .setFooter({ text: `Case ID: ${warnData.caseId}` })
      .setTimestamp();

    if (actionTaken) {
      publicEmbed.addFields({
        name: 'Auto Action',
        value: actionTaken,
        inline: false,
      });
    }

    await message.reply({ embeds: [publicEmbed] });

    // Optionally: If kicked/timed out, alert in channel
    if (actionTaken && warnCount >= 3) {
      await message.channel
        .send(
          `⚠️ **${member.user.tag}** has received ${warnCount} warnings. ${actionTaken}`
        )
        .catch(() => {});
    }
  },
};
