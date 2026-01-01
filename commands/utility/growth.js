const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'growth',
  aliases: ['servergrowth', 'analytics'],
  description: 'Track server growth and statistics',
  usage: '[period]',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const period = args[0]?.toLowerCase() || 'week';

    if (!['day', 'week', 'month', 'year', 'all'].includes(period)) {
      return message.reply(
        '❌ Invalid period! Use: `day`, `week`, `month`, `year`, or `all`'
      );
    }

    const loadingMsg = await message.reply('📊 Analyzing server growth...');

    try {
      const stats = await analyzeGrowth(message.guild, period);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`📊 ${message.guild.name} - Growth Analytics`)
        .setThumbnail(message.guild.iconURL())
        .setDescription(
          `**Period:** ${period.charAt(0).toUpperCase() + period.slice(1)}\n` +
            `**Current Members:** ${branding.formatNumber(message.guild.memberCount)}\n\n` +
            `**Growth Rate:** ${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(2)}%`
        )
        .addFields(
          {
            name: '📈 Member Changes',
            value:
              `**Joined:** ${branding.formatNumber(stats.joined)}\n` +
              `**Left:** ${branding.formatNumber(stats.left)}\n` +
              `**Net Change:** ${stats.netChange > 0 ? '+' : ''}${branding.formatNumber(stats.netChange)}`,
            inline: true,
          },
          {
            name: '💬 Activity',
            value:
              `**Messages:** ${branding.formatNumber(stats.messages)}\n` +
              `**Active Users:** ${branding.formatNumber(stats.activeUsers)}\n` +
              `**Avg/Day:** ${branding.formatNumber(stats.avgMessagesPerDay)}`,
            inline: true,
          },
          {
            name: '🎯 Engagement',
            value:
              `**Engagement Rate:** ${stats.engagementRate.toFixed(1)}%\n` +
              `**Retention Rate:** ${stats.retentionRate.toFixed(1)}%\n` +
              `**Churn Rate:** ${stats.churnRate.toFixed(1)}%`,
            inline: true,
          },
          {
            name: '📊 Trends',
            value: generateTrendChart(stats.dailyGrowth),
            inline: false,
          },
          {
            name: '🏆 Milestones',
            value: getMilestones(message.guild, stats),
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Growth analytics error:', error);
      await loadingMsg.edit('❌ Failed to analyze server growth!');
    }
  },
};

async function analyzeGrowth(guild, period) {
  const now = Date.now();
  const periodMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    all: now,
  };

  const startTime = now - periodMs[period];

  // Get growth data from database
  const growthData = db.get('growth_tracking', guild.id) || {
    joins: [],
    leaves: [],
    messages: [],
  };

  // Filter by period
  const joins = growthData.joins.filter(j => j.timestamp > startTime);
  const leaves = growthData.leaves.filter(l => l.timestamp > startTime);
  const messages = growthData.messages.filter(m => m.timestamp > startTime);

  // Calculate stats
  const joined = joins.length;
  const left = leaves.length;
  const netChange = joined - left;
  const growthRate =
    guild.memberCount > 0 ? (netChange / guild.memberCount) * 100 : 0;

  // Activity stats
  const totalMessages = messages.reduce((sum, m) => sum + m.count, 0);
  const activeUsers = new Set(messages.map(m => m.userId)).size;
  const days = Math.max(1, (now - startTime) / (24 * 60 * 60 * 1000));
  const avgMessagesPerDay = Math.round(totalMessages / days);

  // Engagement metrics
  const engagementRate =
    guild.memberCount > 0 ? (activeUsers / guild.memberCount) * 100 : 0;
  const retentionRate = joined > 0 ? ((joined - left) / joined) * 100 : 100;
  const churnRate = 100 - retentionRate;

  // Daily growth for chart
  const dailyGrowth = calculateDailyGrowth(joins, leaves, Math.min(7, days));

  return {
    joined,
    left,
    netChange,
    growthRate,
    messages: totalMessages,
    activeUsers,
    avgMessagesPerDay,
    engagementRate,
    retentionRate,
    churnRate,
    dailyGrowth,
  };
}

function calculateDailyGrowth(joins, leaves, days) {
  const daily = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i + 1) * dayMs;
    const dayEnd = now - i * dayMs;

    const dayJoins = joins.filter(
      j => j.timestamp >= dayStart && j.timestamp < dayEnd
    ).length;
    const dayLeaves = leaves.filter(
      l => l.timestamp >= dayStart && l.timestamp < dayEnd
    ).length;

    daily.push(dayJoins - dayLeaves);
  }

  return daily;
}

function generateTrendChart(dailyGrowth) {
  if (dailyGrowth.length === 0) return 'No data available';

  const max = Math.max(...dailyGrowth.map(Math.abs), 1);
  const bars = dailyGrowth.map(value => {
    const normalized = Math.round((Math.abs(value) / max) * 8);
    const bar = '█'.repeat(Math.max(1, normalized));
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${bar} ${value}`;
  });

  return '```\n' + bars.join('\n') + '\n```';
}

function getMilestones(guild, stats) {
  const milestones = [];

  // Member count milestones
  const nextMilestone = [100, 500, 1000, 5000, 10000].find(
    m => m > guild.memberCount
  );
  if (nextMilestone) {
    const remaining = nextMilestone - guild.memberCount;
    const daysToReach =
      stats.netChange > 0 ? Math.ceil(remaining / (stats.netChange / 7)) : '∞';
    milestones.push(
      `🎯 ${remaining} members until ${branding.formatNumber(nextMilestone)} (${daysToReach} days)`
    );
  }

  // Growth milestones
  if (stats.growthRate > 10) {
    milestones.push('🚀 Rapid growth detected!');
  } else if (stats.growthRate < -5) {
    milestones.push('⚠️ Declining membership');
  }

  // Engagement milestones
  if (stats.engagementRate > 50) {
    milestones.push('💬 Highly engaged community!');
  }

  return milestones.length > 0 ? milestones.join('\n') : 'No milestones yet';
}
