const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'engagement',
  aliases: ['metrics', 'serverstats'],
  description: 'View detailed engagement metrics',
  usage: '',
  category: 'utility',
  cooldown: 15,
  guildOnly: true,
  async execute(message, args) {
    const loadingMsg = await message.reply(
      '📊 Calculating engagement metrics...'
    );

    try {
      const metrics = await calculateEngagement(message.guild);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`📊 ${message.guild.name} - Engagement Dashboard`)
        .setThumbnail(message.guild.iconURL())
        .setDescription(
          `**Overall Health Score:** ${metrics.healthScore}/100 ${getHealthEmoji(metrics.healthScore)}\n\n` +
            `**Member Breakdown:**\n` +
            `👥 Total: ${branding.formatNumber(message.guild.memberCount)}\n` +
            `✅ Active: ${branding.formatNumber(metrics.activeMembers)} (${metrics.activePercentage.toFixed(1)}%)\n` +
            `💤 Inactive: ${branding.formatNumber(metrics.inactiveMembers)}\n` +
            `🤖 Bots: ${branding.formatNumber(metrics.botCount)}`
        )
        .addFields(
          {
            name: '💬 Message Activity',
            value:
              `**Today:** ${branding.formatNumber(metrics.messagesToday)}\n` +
              `**This Week:** ${branding.formatNumber(metrics.messagesWeek)}\n` +
              `**Avg/Day:** ${branding.formatNumber(metrics.avgMessagesPerDay)}`,
            inline: true,
          },
          {
            name: '🎤 Voice Activity',
            value:
              `**Active Channels:** ${metrics.activeVoiceChannels}\n` +
              `**Users in Voice:** ${metrics.usersInVoice}\n` +
              `**Total Hours (Week):** ${branding.formatNumber(metrics.voiceHoursWeek)}`,
            inline: true,
          },
          {
            name: '📈 Engagement Trends',
            value:
              `**Trend:** ${metrics.trend.emoji} ${metrics.trend.text}\n` +
              `**Peak Time:** ${metrics.peakTime}\n` +
              `**Busiest Day:** ${metrics.busiestDay}`,
            inline: true,
          },
          {
            name: '🏆 Top Contributors',
            value:
              metrics.topContributors.length > 0
                ? metrics.topContributors
                    .map(
                      (c, i) =>
                        `${i + 1}. <@${c.userId}> - ${branding.formatNumber(c.messages)} msgs`
                    )
                    .join('\n')
                : 'No data',
            inline: false,
          },
          {
            name: '📊 Channel Activity',
            value:
              metrics.topChannels.length > 0
                ? metrics.topChannels
                    .map(
                      (c, i) =>
                        `${i + 1}. <#${c.channelId}> - ${branding.formatNumber(c.messages)} msgs`
                    )
                    .join('\n')
                : 'No data',
            inline: false,
          },
          {
            name: '💡 Recommendations',
            value: generateRecommendations(metrics),
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Engagement metrics error:', error);
      await loadingMsg.edit('❌ Failed to calculate engagement metrics!');
    }
  },
};

async function calculateEngagement(guild) {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Get engagement data
  const engagementData = db.get('engagement_tracking', guild.id) || {
    messages: [],
    voice: [],
  };

  // Filter by time periods
  const messagesToday = engagementData.messages.filter(
    m => m.timestamp > oneDayAgo
  );
  const messagesWeek = engagementData.messages.filter(
    m => m.timestamp > oneWeekAgo
  );

  // Calculate active members (sent message in last 7 days)
  const activeUserIds = new Set(messagesWeek.map(m => m.userId));
  const activeMembers = activeUserIds.size;
  const botCount = guild.members.cache.filter(m => m.user.bot).size;
  const humanMembers = guild.memberCount - botCount;
  const inactiveMembers = humanMembers - activeMembers;
  const activePercentage =
    humanMembers > 0 ? (activeMembers / humanMembers) * 100 : 0;

  // Message stats
  const totalMessagesToday = messagesToday.length;
  const totalMessagesWeek = messagesWeek.length;
  const avgMessagesPerDay = Math.round(totalMessagesWeek / 7);

  // Voice stats
  const voiceWeek = engagementData.voice.filter(v => v.timestamp > oneWeekAgo);
  const voiceHoursWeek = Math.round(
    voiceWeek.reduce((sum, v) => sum + v.duration, 0) / (60 * 60 * 1000)
  );
  const activeVoiceChannels = guild.channels.cache.filter(
    c => c.isVoiceBased() && c.members.size > 0
  ).size;
  const usersInVoice = guild.members.cache.filter(m => m.voice.channel).size;

  // Top contributors (last 7 days)
  const userMessageCounts = {};
  for (const msg of messagesWeek) {
    userMessageCounts[msg.userId] = (userMessageCounts[msg.userId] || 0) + 1;
  }
  const topContributors = Object.entries(userMessageCounts)
    .map(([userId, messages]) => ({ userId, messages }))
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 5);

  // Top channels (last 7 days)
  const channelMessageCounts = {};
  for (const msg of messagesWeek) {
    channelMessageCounts[msg.channelId] =
      (channelMessageCounts[msg.channelId] || 0) + 1;
  }
  const topChannels = Object.entries(channelMessageCounts)
    .map(([channelId, messages]) => ({ channelId, messages }))
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 5);

  // Calculate trend
  const lastWeekMessages = engagementData.messages.filter(
    m => m.timestamp > oneWeekAgo * 2 && m.timestamp <= oneWeekAgo
  ).length;
  const trendPercentage =
    lastWeekMessages > 0
      ? ((totalMessagesWeek - lastWeekMessages) / lastWeekMessages) * 100
      : 0;

  let trend;
  if (trendPercentage > 10) {
    trend = { emoji: '📈', text: `Growing (+${trendPercentage.toFixed(1)}%)` };
  } else if (trendPercentage < -10) {
    trend = { emoji: '📉', text: `Declining (${trendPercentage.toFixed(1)}%)` };
  } else {
    trend = { emoji: '➡️', text: 'Stable' };
  }

  // Peak time and busiest day
  const hourCounts = new Array(24).fill(0);
  const dayCounts = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  for (const msg of messagesWeek) {
    const date = new Date(msg.timestamp);
    hourCounts[date.getHours()]++;
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    dayCounts[day]++;
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakTime = `${peakHour}:00 - ${peakHour + 1}:00`;
  const busiestDay = Object.entries(dayCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  // Calculate health score (0-100)
  const healthScore = Math.min(
    100,
    Math.round(
      activePercentage * 0.4 + // 40% weight on active members
        Math.min(100, (avgMessagesPerDay / 100) * 100) * 0.3 + // 30% weight on messages
        Math.min(100, (voiceHoursWeek / 100) * 100) * 0.2 + // 20% weight on voice
        (trendPercentage > 0 ? 10 : 0) // 10% bonus for positive trend
    )
  );

  return {
    healthScore,
    activeMembers,
    inactiveMembers,
    activePercentage,
    botCount,
    messagesToday: totalMessagesToday,
    messagesWeek: totalMessagesWeek,
    avgMessagesPerDay,
    voiceHoursWeek,
    activeVoiceChannels,
    usersInVoice,
    topContributors,
    topChannels,
    trend,
    peakTime,
    busiestDay,
  };
}

function getHealthEmoji(score) {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

function generateRecommendations(metrics) {
  const recommendations = [];

  if (metrics.activePercentage < 30) {
    recommendations.push('• Consider hosting events to boost engagement');
  }

  if (metrics.avgMessagesPerDay < 50) {
    recommendations.push('• Create more discussion channels');
  }

  if (metrics.voiceHoursWeek < 10) {
    recommendations.push('• Promote voice chat activities');
  }

  if (metrics.trend.emoji === '📉') {
    recommendations.push('• Analyze what changed and re-engage members');
  }

  if (recommendations.length === 0) {
    recommendations.push('• Great job! Keep up the engagement! 🎉');
  }

  return recommendations.join('\n');
}
