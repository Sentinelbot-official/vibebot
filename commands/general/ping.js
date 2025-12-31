const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Check bot latency and API response time',
  aliases: ['latency', 'pong'],
  category: 'general',
  cooldown: 3,
  async execute(message, args) {
    // Send initial message
    const sent = await message.reply('🏓 Pinging...');

    // Calculate latencies
    const messageLatency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = Math.round(message.client.ws.ping);

    // Calculate database latency
    const dbStart = Date.now();
    const db = require('../../utils/database');
const branding = require('../../utils/branding');
    db.get('ping_test', 'test');
    const dbLatency = Date.now() - dbStart;

    // Determine quality
    const getQuality = latency => {
      if (latency < 100)
        return { emoji: '🟢', text: 'Excellent', color: 0x00ff00 };
      if (latency < 200) return { emoji: '🟡', text: 'Good', color: 0xffff00 };
      if (latency < 400) return { emoji: '🟠', text: 'Fair', color: 0xff9900 };
      return { emoji: '🔴', text: 'Poor', color: 0xff0000 };
    };

    const messageQuality = getQuality(messageLatency);
    const apiQuality = getQuality(apiLatency);
    const dbQuality = getQuality(dbLatency);

    // Calculate uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime) % 60;

    // Memory usage
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
      2
    );

    // Shard info
    const shardId = message.client.shard ? message.client.shard.ids[0] : 0;
    const totalShards = message.client.shard ? message.client.shard.count : 1;

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(messageQuality.color)
      .setTitle('🏓 Pong! - Latency Statistics')
      .setDescription(
        `**Overall Status:** ${messageQuality.emoji} ${messageQuality.text}\n\n` +
          `Bot is responding and operational!`
      )
      .addFields(
        {
          name: '📨 Message Latency',
          value:
            `**${messageLatency}ms** ${messageQuality.emoji}\n` +
            `Time to send and receive a message`,
          inline: true,
        },
        {
          name: '💓 API Latency',
          value:
            `**${apiLatency}ms** ${apiQuality.emoji}\n` +
            `WebSocket heartbeat to Discord`,
          inline: true,
        },
        {
          name: '💾 Database Latency',
          value:
            `**${dbLatency}ms** ${dbQuality.emoji}\n` +
            `Time to query database`,
          inline: true,
        },
        {
          name: '⏰ Uptime',
          value:
            `${days}d ${hours}h ${minutes}m ${seconds}s\n` +
            `Bot has been running continuously`,
          inline: true,
        },
        {
          name: '💾 Memory Usage',
          value: `**${memoryUsage} MB**\n` + `Current heap memory usage`,
          inline: true,
        },
        {
          name: '🔷 Shard Info',
          value:
            `**Shard ${shardId}** of ${totalShards}\n` +
            `Current shard serving this server`,
          inline: true,
        }
      )
      .setFooter({
        text: `Requested by ${message.author.tag} | Shard ${shardId}/${totalShards}`,
      })
      .setTimestamp();

    // Add quality indicators
    const qualityBar = latency => {
      if (latency < 100) return '▓▓▓▓▓▓▓▓▓▓ 100%';
      if (latency < 200) return '▓▓▓▓▓▓▓▓░░ 80%';
      if (latency < 400) return '▓▓▓▓▓░░░░░ 50%';
      return '▓▓░░░░░░░░ 20%';
    };

    embed.addFields({
      name: '📊 Performance Metrics',
      value:
        `**Message:** ${qualityBar(messageLatency)}\n` +
        `**API:** ${qualityBar(apiLatency)}\n` +
        `**Database:** ${qualityBar(dbLatency)}`,
      inline: false,
    });

    // Edit the original message
    await sent.edit({ content: null, embeds: [embed] });
  },
};
