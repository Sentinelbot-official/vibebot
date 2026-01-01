const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'peaktime',
  aliases: ['peak', 'besttime'],
  description: 'Analyze peak activity times',
  usage: '',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const loadingMsg = await message.reply('📊 Analyzing peak activity times...');

    try {
      const analysis = await analyzePeakTimes(message.guild);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`⏰ ${message.guild.name} - Peak Activity Analysis`)
        .setDescription(
          `**Best Time to Post:** ${analysis.bestTime}\n` +
            `**Most Active Day:** ${analysis.mostActiveDay}\n` +
            `**Least Active Day:** ${analysis.leastActiveDay}\n\n` +
            '**Activity by Hour:**\n' +
            generateHourlyActivity(analysis.hourly)
        )
        .addFields(
          {
            name: '🔥 Peak Hours',
            value: analysis.peakHours
              .map(
                (h, i) =>
                  `${i + 1}. ${h.hour}:00 - ${branding.formatNumber(h.count)} messages`
              )
              .join('\n'),
            inline: true,
          },
          {
            name: '💤 Quiet Hours',
            value: analysis.quietHours
              .map(
                (h, i) =>
                  `${i + 1}. ${h.hour}:00 - ${branding.formatNumber(h.count)} messages`
              )
              .join('\n'),
            inline: true,
          },
          {
            name: '📅 Weekly Pattern',
            value: generateWeeklyPattern(analysis.daily),
            inline: false,
          },
          {
            name: '💡 Recommendations',
            value: generateTimeRecommendations(analysis),
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Peak time analysis error:', error);
      await loadingMsg.edit('❌ Failed to analyze peak times!');
    }
  },
};

async function analyzePeakTimes(guild) {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Get activity data
  const activityData = db.get('activity_tracking', guild.id) || {
    messages: [],
  };

  // Filter last 30 days
  const recentMessages = activityData.messages.filter(
    m => m.timestamp > thirtyDaysAgo
  );

  // Group by hour (0-23)
  const hourly = new Array(24).fill(0);
  const daily = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  for (const msg of recentMessages) {
    const date = new Date(msg.timestamp);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });

    hourly[hour]++;
    daily[day]++;
  }

  // Find peak hours (top 5)
  const peakHours = hourly
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Find quiet hours (bottom 5)
  const quietHours = hourly
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  // Best time to post (highest activity)
  const bestHour = peakHours[0].hour;
  const bestTime = `${bestHour}:00 - ${bestHour + 1}:00`;

  // Most/least active days
  const sortedDays = Object.entries(daily).sort((a, b) => b[1] - a[1]);
  const mostActiveDay = sortedDays[0][0];
  const leastActiveDay = sortedDays[sortedDays.length - 1][0];

  return {
    hourly,
    daily,
    peakHours,
    quietHours,
    bestTime,
    mostActiveDay,
    leastActiveDay,
  };
}

function generateHourlyActivity(hourly) {
  const max = Math.max(...hourly, 1);
  let chart = '```\n';

  for (let i = 0; i < 24; i += 2) {
    const count1 = hourly[i];
    const count2 = hourly[i + 1];
    const bar1Length = Math.round((count1 / max) * 15);
    const bar2Length = Math.round((count2 / max) * 15);

    chart += `${i.toString().padStart(2, '0')}h ${'█'.repeat(bar1Length)}\n`;
    chart += `${(i + 1).toString().padStart(2, '0')}h ${'█'.repeat(bar2Length)}\n`;
  }

  chart += '```';
  return chart;
}

function generateWeeklyPattern(daily) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const max = Math.max(...Object.values(daily), 1);

  let pattern = '```\n';
  for (const day of days) {
    const count = daily[day];
    const barLength = Math.round((count / max) * 15);
    const bar = '█'.repeat(barLength);

    pattern += `${day.substring(0, 3)} ${bar} ${branding.formatNumber(count)}\n`;
  }
  pattern += '```';

  return pattern;
}

function generateTimeRecommendations(analysis) {
  const recommendations = [];

  // Best posting time
  recommendations.push(
    `📢 **Post announcements at ${analysis.bestTime}** for maximum visibility`
  );

  // Weekend vs weekday
  const weekendActivity =
    analysis.daily.Saturday + analysis.daily.Sunday;
  const weekdayActivity =
    analysis.daily.Monday +
    analysis.daily.Tuesday +
    analysis.daily.Wednesday +
    analysis.daily.Thursday +
    analysis.daily.Friday;

  if (weekendActivity > weekdayActivity / 2) {
    recommendations.push('🎮 **Weekend activity is strong** - schedule events then');
  } else {
    recommendations.push('💼 **Weekday activity dominates** - focus on weekday engagement');
  }

  // Peak hour advice
  if (analysis.peakHours[0].hour >= 18 && analysis.peakHours[0].hour <= 23) {
    recommendations.push('🌙 **Evening is your prime time** - schedule events 6-11 PM');
  } else if (analysis.peakHours[0].hour >= 12 && analysis.peakHours[0].hour <= 17) {
    recommendations.push('☀️ **Afternoon is most active** - schedule events 12-5 PM');
  } else {
    recommendations.push('🌅 **Morning activity detected** - consider morning events');
  }

  return recommendations.join('\n\n');
}
