const { EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  name: 'uptime',
  description: 'Show detailed bot uptime and system statistics',
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    const botUptime = process.uptime();
    const days = Math.floor(botUptime / 86400);
    const hours = Math.floor(botUptime / 3600) % 24;
    const minutes = Math.floor(botUptime / 60) % 60;
    const seconds = Math.floor(botUptime) % 60;

    // System uptime
    const systemUptime = os.uptime();
    const sysDays = Math.floor(systemUptime / 86400);
    const sysHours = Math.floor(systemUptime / 3600) % 24;
    const sysMinutes = Math.floor(systemUptime / 60) % 60;

    // Calculate uptime percentage (bot vs system)
    const uptimePercentage = ((botUptime / systemUptime) * 100).toFixed(2);

    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    const memPercentage = (
      (memUsage.heapUsed / memUsage.heapTotal) *
      100
    ).toFixed(1);

    // System memory
    const totalSysMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeSysMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedSysMem = (totalSysMem - freeSysMem).toFixed(2);
    const sysMemPercentage = ((usedSysMem / totalSysMem) * 100).toFixed(1);

    // Calculate start time
    const startTime = Math.floor((Date.now() - botUptime * 1000) / 1000);

    // Get uptime quality indicator
    const getUptimeQuality = days => {
      if (days >= 30)
        return { emoji: '🟢', text: 'Excellent', color: 0x00ff00 };
      if (days >= 7) return { emoji: '🟡', text: 'Good', color: 0xffff00 };
      if (days >= 1) return { emoji: '🟠', text: 'Fair', color: 0xff9900 };
      return { emoji: '🔴', text: 'Recent Restart', color: 0xff0000 };
    };

    const quality = getUptimeQuality(days);

    // Shard info if available
    let shardInfo = '';
    if (message.client.shard) {
      const shardId = message.client.shard.ids[0];
      const totalShards = message.client.shard.count;

      try {
        // Get uptime for all shards
        const shardUptimes =
          await message.client.shard.fetchClientValues('uptime');
        const avgUptime =
          shardUptimes.reduce((a, b) => a + b, 0) / shardUptimes.length;
        const avgDays = Math.floor(avgUptime / 1000 / 86400);
        const avgHours = Math.floor(avgUptime / 1000 / 3600) % 24;

        shardInfo = `**Current Shard:** ${shardId}/${totalShards - 1}\n**Avg Shard Uptime:** ${avgDays}d ${avgHours}h`;
      } catch (err) {
        shardInfo = `**Current Shard:** ${shardId}/${totalShards - 1}`;
      }
    }

    // Calculate uptime streak
    const uptimeStreak =
      days > 0
        ? `${days} day${days !== 1 ? 's' : ''} without restart! 🎉`
        : hours > 0
          ? `${hours} hour${hours !== 1 ? 's' : ''} since last restart`
          : `${minutes} minute${minutes !== 1 ? 's' : ''} since last restart`;

    const embed = new EmbedBuilder()
      .setColor(quality.color)
      .setTitle(`${quality.emoji} Bot Uptime & Health`)
      .setDescription(
        `**Status:** ${quality.text}\n` +
          `**Uptime Streak:** ${uptimeStreak}\n\u200b`
      )
      .addFields(
        {
          name: '⏰ Bot Uptime',
          value:
            `**${days}**d **${hours}**h **${minutes}**m **${seconds}**s\n` +
            `Started <t:${startTime}:R>`,
          inline: true,
        },
        {
          name: '🖥️ System Uptime',
          value:
            `**${sysDays}**d **${sysHours}**h **${sysMinutes}**m\n` +
            `Bot: ${uptimePercentage}% of system uptime`,
          inline: true,
        },
        {
          name: '📊 Uptime Statistics',
          value:
            `**Total Hours:** ${Math.floor(botUptime / 3600)}\n` +
            `**Total Minutes:** ${Math.floor(botUptime / 60).toLocaleString()}\n` +
            `**Total Seconds:** ${Math.floor(botUptime).toLocaleString()}`,
          inline: true,
        },
        {
          name: '💾 Bot Memory',
          value:
            `**${memUsedMB}** MB / **${memTotalMB}** MB\n` +
            `Usage: ${memPercentage}% ${memPercentage > 80 ? '⚠️' : '✅'}`,
          inline: true,
        },
        {
          name: '🖥️ System Memory',
          value:
            `**${usedSysMem}** GB / **${totalSysMem}** GB\n` +
            `Usage: ${sysMemPercentage}% ${sysMemPercentage > 80 ? '⚠️' : '✅'}`,
          inline: true,
        },
        {
          name: '⚡ Performance',
          value:
            `**CPU Cores:** ${os.cpus().length}\n` +
            `**Platform:** ${os.platform()}\n` +
            `**Node.js:** ${process.version}`,
          inline: true,
        }
      );

    if (shardInfo) {
      embed.addFields({
        name: '🔷 Shard Information',
        value: shardInfo,
        inline: false,
      });
    }

    // Add health indicators
    const healthIndicators = [];
    if (memPercentage < 80) healthIndicators.push('✅ Memory Healthy');
    else healthIndicators.push('⚠️ High Memory Usage');

    if (days >= 1) healthIndicators.push('✅ Stable Uptime');
    else healthIndicators.push('🔄 Recently Restarted');

    if (message.client.ws.ping < 200) healthIndicators.push('✅ Low Latency');
    else healthIndicators.push('⚠️ High Latency');

    embed.addFields({
      name: '🏥 Health Status',
      value: healthIndicators.join('\n'),
      inline: false,
    });

    // Add uptime milestones
    const milestones = [];
    if (days >= 365) milestones.push('🏆 1 Year Milestone!');
    else if (days >= 180) milestones.push('🎖️ 6 Months Milestone!');
    else if (days >= 90) milestones.push('🥇 90 Days Milestone!');
    else if (days >= 30) milestones.push('🥈 30 Days Milestone!');
    else if (days >= 7) milestones.push('🥉 1 Week Milestone!');

    if (milestones.length > 0) {
      embed.addFields({
        name: '🎯 Milestones',
        value: milestones.join('\n'),
        inline: false,
      });
    }

    embed.setFooter({
      text: `Requested by ${message.author.tag} | Bot running since ${new Date(Date.now() - botUptime * 1000).toLocaleDateString()}`,
      iconURL: message.author.displayAvatarURL(),
    });
    embed.setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
