const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');

module.exports = {
  name: 'advancedmod',
  description: 'Advanced moderation tools (Premium only)',
  usage: '//advancedmod <auditlog/insights/automod> [options]',
  aliases: ['amod', 'premiummod'],
  category: 'premium',
  cooldown: 10,
  async execute(message, args) {
    const guildId = message.guild.id;
    const hasPremium = premiumPerks.hasFeature(guildId, 'premium_badge');

    if (!hasPremium) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Premium Required')
        .setDescription(
          'Advanced moderation is a **Premium** feature!\n\n' +
            '**Premium Benefits:**\n' +
            '• Extended audit logs (90 days)\n' +
            '• Moderation insights\n' +
            '• Advanced auto-mod rules\n' +
            '• Member screening\n' +
            '• All Premium features\n\n' +
            'Use `//premium` to upgrade!'
        )
        .setFooter({ text: 'Support the 24/7 live coding journey! 💜' });

      return message.reply({ embeds: [embed] });
    }

    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply(
        '❌ You need the **Moderate Members** permission to use advanced moderation tools!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['auditlog', 'insights', 'automod'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🛡️ Advanced Moderation')
        .setDescription(
          '**Premium moderation tools for your server!**\n\n' +
            '**Commands:**\n' +
            '`//advancedmod auditlog [days]` - View extended audit logs\n' +
            '`//advancedmod insights` - View moderation insights\n' +
            '`//advancedmod automod` - Configure advanced auto-mod\n\n' +
            '**Premium Features:**\n' +
            '• 90-day audit log retention\n' +
            '• Detailed moderation statistics\n' +
            '• Advanced auto-mod rules\n' +
            '• Member behavior tracking'
        )
        .setFooter({ text: '💎 Premium Feature' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'auditlog') {
      const days = parseInt(args[1]) || 7;

      if (days < 1 || days > 90) {
        return message.reply('❌ Days must be between 1 and 90!');
      }

      const auditLogs = db.get('audit_logs', guildId) || [];
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      const recentLogs = auditLogs.filter(log => log.timestamp > cutoffTime);

      if (recentLogs.length === 0) {
        return message.reply(
          `📭 No audit logs found for the last ${days} days!`
        );
      }

      // Group by action type
      const actionCounts = {};
      for (const log of recentLogs) {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📋 Audit Log (Last ${days} Days)`)
        .setDescription(
          `**Total Actions:** ${recentLogs.length}\n\n` +
            '**Actions Breakdown:**\n' +
            Object.entries(actionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([action, count]) => `• **${action}:** ${count}`)
              .join('\n')
        )
        .addFields({
          name: '📊 Recent Actions',
          value: recentLogs
            .slice(0, 10)
            .map(
              log =>
                `\`${new Date(log.timestamp).toLocaleDateString()}\` - ${log.action} by <@${log.moderator}>`
            )
            .join('\n'),
          inline: false,
        })
        .setFooter({ text: '💎 Premium Feature | Extended audit logs' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'insights') {
      const modStats = db.get('mod_stats', guildId) || {
        warns: 0,
        kicks: 0,
        bans: 0,
        timeouts: 0,
        automod: 0,
      };

      const topModerators = db.get('top_moderators', guildId) || {};
      const sortedMods = Object.entries(topModerators)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Get recent trends
      const last7Days = db.get('mod_trends_7d', guildId) || {};
      const last30Days = db.get('mod_trends_30d', guildId) || {};

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 Moderation Insights')
        .setDescription('**Server Moderation Statistics**')
        .addFields(
          {
            name: '🛡️ All-Time Actions',
            value:
              `**Warns:** ${modStats.warns.toLocaleString()}\n` +
              `**Kicks:** ${modStats.kicks.toLocaleString()}\n` +
              `**Bans:** ${modStats.bans.toLocaleString()}\n` +
              `**Timeouts:** ${modStats.timeouts.toLocaleString()}\n` +
              `**Auto-Mod:** ${modStats.automod.toLocaleString()}`,
            inline: true,
          },
          {
            name: '📈 Last 7 Days',
            value:
              `**Warns:** ${last7Days.warns || 0}\n` +
              `**Kicks:** ${last7Days.kicks || 0}\n` +
              `**Bans:** ${last7Days.bans || 0}\n` +
              `**Avg/Day:** ${Math.floor((last7Days.warns || 0) / 7)}`,
            inline: true,
          },
          {
            name: '📅 Last 30 Days',
            value:
              `**Warns:** ${last30Days.warns || 0}\n` +
              `**Kicks:** ${last30Days.kicks || 0}\n` +
              `**Bans:** ${last30Days.bans || 0}\n` +
              `**Avg/Day:** ${Math.floor((last30Days.warns || 0) / 30)}`,
            inline: true,
          }
        );

      if (sortedMods.length > 0) {
        embed.addFields({
          name: '👮 Top Moderators',
          value: sortedMods
            .map(([id, count], i) => `${i + 1}. <@${id}> - ${count} actions`)
            .join('\n'),
          inline: false,
        });
      }

      embed.setFooter({ text: '💎 Premium Feature | Moderation insights' });
      embed.setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'automod') {
      const automodSettings = db.get('premium_automod', guildId) || {
        enabled: false,
        strictMode: false,
        customRules: [],
      };

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🤖 Advanced Auto-Mod')
        .setDescription(
          '**Premium Auto-Moderation Settings**\n\n' +
            `**Status:** ${automodSettings.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `**Strict Mode:** ${automodSettings.strictMode ? '✅ On' : '❌ Off'}\n` +
            `**Custom Rules:** ${automodSettings.customRules.length}\n\n` +
            '**Premium Features:**\n' +
            '• Advanced spam detection\n' +
            '• Custom word filters\n' +
            '• Link whitelist/blacklist\n' +
            '• Raid protection\n' +
            '• Member screening\n\n' +
            '**Note:** Configure advanced auto-mod in your server settings or contact support for setup assistance.'
        )
        .setFooter({ text: '💎 Premium Feature | Advanced protection' });

      return message.reply({ embeds: [embed] });
    }
  },
};
