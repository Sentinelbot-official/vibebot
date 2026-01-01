const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'retention',
  aliases: ['churn', 'memberretention'],
  description: 'Analyze member retention and churn',
  usage: '',
  category: 'utility',
  cooldown: 15,
  guildOnly: true,
  async execute(message, args) {
    const loadingMsg = await message.reply('📊 Analyzing retention metrics...');

    try {
      const analysis = await analyzeRetention(message.guild);

      const embed = new EmbedBuilder()
        .setColor(getRetentionColor(analysis.retentionRate))
        .setTitle(`📊 ${message.guild.name} - Retention Analysis`)
        .setDescription(
          `**Retention Rate:** ${analysis.retentionRate.toFixed(1)}% ${getRetentionEmoji(analysis.retentionRate)}\n` +
            `**Churn Rate:** ${analysis.churnRate.toFixed(1)}%\n\n` +
            `**Member Lifecycle:**\n` +
            `👋 Joined (30d): ${branding.formatNumber(analysis.joined30d)}\n` +
            `🚪 Left (30d): ${branding.formatNumber(analysis.left30d)}\n` +
            `📊 Net Change: ${analysis.netChange > 0 ? '+' : ''}${branding.formatNumber(analysis.netChange)}`
        )
        .addFields(
          {
            name: '⏱️ Average Stay Duration',
            value:
              `**All Members:** ${formatDuration(analysis.avgStayDuration)}\n` +
              `**Recent Leavers:** ${formatDuration(analysis.avgLeaverDuration)}\n` +
              `**Median:** ${formatDuration(analysis.medianStayDuration)}`,
            inline: true,
          },
          {
            name: '📈 Retention by Period',
            value:
              `**7 Days:** ${analysis.retention7d.toFixed(1)}%\n` +
              `**30 Days:** ${analysis.retention30d.toFixed(1)}%\n` +
              `**90 Days:** ${analysis.retention90d.toFixed(1)}%`,
            inline: true,
          },
          {
            name: '🎯 Member Segments',
            value:
              `**New (<7d):** ${branding.formatNumber(analysis.newMembers)}\n` +
              `**Active (7-30d):** ${branding.formatNumber(analysis.activeMembers)}\n` +
              `**Established (>30d):** ${branding.formatNumber(analysis.establishedMembers)}`,
            inline: true,
          },
          {
            name: '📊 Churn Analysis',
            value: generateChurnChart(analysis.churnByWeek),
            inline: false,
          },
          {
            name: '🔍 Risk Factors',
            value: identifyRiskFactors(analysis),
            inline: false,
          },
          {
            name: '💡 Recommendations',
            value: generateRetentionRecommendations(analysis),
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Retention analysis error:', error);
      await loadingMsg.edit('❌ Failed to analyze retention!');
    }
  },
};

async function analyzeRetention(guild) {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // Get member tracking data
  const memberData = db.get('member_tracking', guild.id) || {
    joins: [],
    leaves: [],
  };

  // Filter by periods
  const joined7d = memberData.joins.filter(j => j.timestamp > sevenDaysAgo);
  const joined30d = memberData.joins.filter(j => j.timestamp > thirtyDaysAgo);
  const joined90d = memberData.joins.filter(j => j.timestamp > ninetyDaysAgo);

  const left7d = memberData.leaves.filter(l => l.timestamp > sevenDaysAgo);
  const left30d = memberData.leaves.filter(l => l.timestamp > thirtyDaysAgo);
  const left90d = memberData.leaves.filter(l => l.timestamp > ninetyDaysAgo);

  // Calculate retention rates
  const retention7d =
    joined7d.length > 0
      ? ((joined7d.length - left7d.length) / joined7d.length) * 100
      : 100;
  const retention30d =
    joined30d.length > 0
      ? ((joined30d.length - left30d.length) / joined30d.length) * 100
      : 100;
  const retention90d =
    joined90d.length > 0
      ? ((joined90d.length - left90d.length) / joined90d.length) * 100
      : 100;

  const retentionRate = retention30d;
  const churnRate = 100 - retentionRate;

  // Calculate stay durations
  const stayDurations = memberData.leaves
    .map(l => {
      const joinRecord = memberData.joins.find(j => j.userId === l.userId);
      return joinRecord ? l.timestamp - joinRecord.timestamp : 0;
    })
    .filter(d => d > 0);

  const avgStayDuration =
    stayDurations.length > 0
      ? stayDurations.reduce((a, b) => a + b, 0) / stayDurations.length
      : 0;

  const recentLeavers = memberData.leaves.filter(
    l => l.timestamp > thirtyDaysAgo
  );
  const recentStayDurations = recentLeavers
    .map(l => {
      const joinRecord = memberData.joins.find(j => j.userId === l.userId);
      return joinRecord ? l.timestamp - joinRecord.timestamp : 0;
    })
    .filter(d => d > 0);

  const avgLeaverDuration =
    recentStayDurations.length > 0
      ? recentStayDurations.reduce((a, b) => a + b, 0) /
        recentStayDurations.length
      : 0;

  const sortedDurations = [...stayDurations].sort((a, b) => a - b);
  const medianStayDuration =
    sortedDurations.length > 0
      ? sortedDurations[Math.floor(sortedDurations.length / 2)]
      : 0;

  // Member segments
  const currentMembers = guild.members.cache.filter(m => !m.user.bot);
  let newMembers = 0;
  let activeMembers = 0;
  let establishedMembers = 0;

  for (const member of currentMembers.values()) {
    const joinedAt = member.joinedTimestamp;
    const age = now - joinedAt;

    if (age < 7 * 24 * 60 * 60 * 1000) {
      newMembers++;
    } else if (age < 30 * 24 * 60 * 60 * 1000) {
      activeMembers++;
    } else {
      establishedMembers++;
    }
  }

  // Churn by week (last 4 weeks)
  const churnByWeek = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;

    const weekLeaves = memberData.leaves.filter(
      l => l.timestamp >= weekStart && l.timestamp < weekEnd
    ).length;

    churnByWeek.push(weekLeaves);
  }

  return {
    retentionRate,
    churnRate,
    joined30d: joined30d.length,
    left30d: left30d.length,
    netChange: joined30d.length - left30d.length,
    retention7d,
    retention30d,
    retention90d,
    avgStayDuration,
    avgLeaverDuration,
    medianStayDuration,
    newMembers,
    activeMembers,
    establishedMembers,
    churnByWeek,
  };
}

function getRetentionColor(rate) {
  if (rate >= 80) return branding.colors.success;
  if (rate >= 60) return branding.colors.primary;
  if (rate >= 40) return branding.colors.warning;
  return branding.colors.error;
}

function getRetentionEmoji(rate) {
  if (rate >= 80) return '🟢';
  if (rate >= 60) return '🟡';
  if (rate >= 40) return '🟠';
  return '🔴';
}

function formatDuration(ms) {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days === 0) return '< 1 day';
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  if (days < 30)
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''}`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''}`;
}

function generateChurnChart(churnByWeek) {
  const max = Math.max(...churnByWeek, 1);
  let chart = '```\n';

  churnByWeek.forEach((count, i) => {
    const barLength = Math.round((count / max) * 20);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    chart += `Week ${i + 1} ${bar} ${count}\n`;
  });

  chart += '```';
  return chart;
}

function identifyRiskFactors(analysis) {
  const risks = [];

  if (analysis.churnRate > 30) {
    risks.push('🔴 **High churn rate** - Many members leaving');
  }

  if (analysis.avgLeaverDuration < 7 * 24 * 60 * 60 * 1000) {
    risks.push('⚠️ **Members leaving quickly** - Poor onboarding?');
  }

  if (analysis.netChange < 0) {
    risks.push('📉 **Negative growth** - Losing more than gaining');
  }

  const churnTrend = analysis.churnByWeek[3] - analysis.churnByWeek[0];
  if (churnTrend > 5) {
    risks.push('📈 **Increasing churn trend** - Situation worsening');
  }

  if (risks.length === 0) {
    risks.push('✅ **No major risk factors detected**');
  }

  return risks.join('\n');
}

function generateRetentionRecommendations(analysis) {
  const recommendations = [];

  if (analysis.churnRate > 30) {
    recommendations.push('• Improve onboarding experience for new members');
    recommendations.push('• Create a welcome channel with clear guidelines');
  }

  if (analysis.avgLeaverDuration < 7 * 24 * 60 * 60 * 1000) {
    recommendations.push('• Add a welcome quiz or verification system');
    recommendations.push('• Assign roles to new members quickly');
  }

  if (analysis.newMembers > analysis.establishedMembers) {
    recommendations.push('• Focus on retaining existing members');
    recommendations.push('• Create loyalty rewards or recognition');
  }

  if (recommendations.length === 0) {
    recommendations.push('• Excellent retention! Keep up the great work! 🎉');
  }

  return recommendations.join('\n');
}
