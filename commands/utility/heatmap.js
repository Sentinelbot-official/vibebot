const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'heatmap',
  aliases: ['activitymap', 'activehours'],
  description: 'View member activity heatmaps',
  usage: '[user]',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;

    const loadingMsg = await message.reply('📊 Generating activity heatmap...');

    try {
      const activityData = await generateHeatmap(message.guild, target);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`📊 Activity Heatmap - ${target.tag}`)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(
          '**Activity by Hour (Last 7 Days)**\n\n' +
            generateHourlyChart(activityData.hourly) +
            '\n\n**Activity by Day of Week**\n\n' +
            generateDailyChart(activityData.daily)
        )
        .addFields(
          {
            name: '⏰ Peak Hours',
            value:
              activityData.peakHours.length > 0
                ? activityData.peakHours
                    .map(h => `${h.hour}:00 - ${h.count} messages`)
                    .join('\n')
                : 'No data',
            inline: true,
          },
          {
            name: '📅 Most Active Days',
            value:
              activityData.peakDays.length > 0
                ? activityData.peakDays
                    .map(d => `${d.day} - ${d.count} messages`)
                    .join('\n')
                : 'No data',
            inline: true,
          },
          {
            name: '📊 Statistics',
            value:
              `**Total Messages:** ${branding.formatNumber(activityData.total)}\n` +
              `**Avg/Day:** ${branding.formatNumber(activityData.avgPerDay)}\n` +
              `**Most Active:** ${activityData.mostActiveTime}`,
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Heatmap generation error:', error);
      await loadingMsg.edit('❌ Failed to generate heatmap!');
    }
  },
};

async function generateHeatmap(guild, user) {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Get user activity data
  const activityData = db.get(
    'activity_tracking',
    `${guild.id}_${user.id}`
  ) || {
    messages: [],
  };

  // Filter last 7 days
  const recentMessages = activityData.messages.filter(
    m => m.timestamp > sevenDaysAgo
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

  // Find peak hours (top 3)
  const peakHours = hourly
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter(h => h.count > 0);

  // Find peak days (top 3)
  const peakDays = Object.entries(daily)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter(d => d.count > 0);

  // Calculate stats
  const total = recentMessages.length;
  const avgPerDay = Math.round(total / 7);
  const mostActiveHour = peakHours[0]?.hour || 0;
  const mostActiveDay = peakDays[0]?.day || 'Unknown';
  const mostActiveTime = `${mostActiveDay} at ${mostActiveHour}:00`;

  return {
    hourly,
    daily,
    peakHours,
    peakDays,
    total,
    avgPerDay,
    mostActiveTime,
  };
}

function generateHourlyChart(hourly) {
  const max = Math.max(...hourly, 1);
  const blocks = ['░', '▒', '▓', '█'];

  let chart = '```\n';
  for (let i = 0; i < 24; i++) {
    const intensity = hourly[i] / max;
    const blockIndex = Math.min(
      blocks.length - 1,
      Math.floor(intensity * blocks.length)
    );
    const block = blocks[blockIndex];

    chart += `${i.toString().padStart(2, '0')}:00 ${block.repeat(10)} ${hourly[i]}\n`;
  }
  chart += '```';

  return chart;
}

function generateDailyChart(daily) {
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const max = Math.max(...Object.values(daily), 1);

  let chart = '```\n';
  for (const day of days) {
    const count = daily[day];
    const barLength = Math.round((count / max) * 20);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

    chart += `${day.substring(0, 3)} ${bar} ${count}\n`;
  }
  chart += '```';

  return chart;
}
