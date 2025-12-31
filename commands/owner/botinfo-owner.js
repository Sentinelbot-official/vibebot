const { EmbedBuilder } = require('discord.js');
const os = require('os');
const logger = require('../../utils/logger');
const branding = require('../../utils/branding');

module.exports = {
  name: 'botinfo-owner',
  aliases: ['bi-owner', 'stats-owner'],
  description: 'Detailed bot statistics and system info (Owner Only)',
  category: 'owner',
  ownerOnly: true,
  cooldown: 0,
  execute(message, args) {
    const client = message.client;

    // Calculate uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime) % 60;
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Memory usage (detailed)
    const memUsage = process.memoryUsage();
    const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    const rss = (memUsage.rss / 1024 / 1024).toFixed(2);
    const external = (memUsage.external / 1024 / 1024).toFixed(2);

    // System info
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMemory = (totalMemory - freeMemory).toFixed(2);
    const cpuCount = os.cpus().length;
    const cpuModel = os.cpus()[0].model;

    // Bot stats
    const totalChannels = client.channels.cache.size;
    const textChannels = client.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = client.channels.cache.filter(c => c.type === 2).size;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🔴 Owner Bot Statistics')
      .setDescription(
        `Detailed system and bot information for ${client.user.tag}`
      )
      .addFields(
        {
          name: '📊 Bot Statistics',
          value:
            `**Servers:** ${client.guilds.cache.size}\n` +
            `**Users:** ${client.users.cache.size}\n` +
            `**Channels:** ${totalChannels} (${textChannels} text, ${voiceChannels} voice)\n` +
            `**Commands:** ${client.commands.size}\n` +
            `**Uptime:** ${uptimeString}\n` +
            `**Ping:** ${Math.round(client.ws.ping)}ms`,
          inline: false,
        },
        {
          name: '💾 Process Memory',
          value:
            `**Heap Used:** ${heapUsed} MB\n` +
            `**Heap Total:** ${heapTotal} MB\n` +
            `**RSS:** ${rss} MB\n` +
            `**External:** ${external} MB`,
          inline: true,
        },
        {
          name: '🖥️ System Memory',
          value:
            `**Total:** ${totalMemory} GB\n` +
            `**Used:** ${usedMemory} GB\n` +
            `**Free:** ${freeMemory} GB\n` +
            `**Usage:** ${((usedMemory / totalMemory) * 100).toFixed(1)}%`,
          inline: true,
        },
        {
          name: '⚙️ System Info',
          value:
            `**Platform:** ${os.platform()} ${os.arch()}\n` +
            `**CPU Cores:** ${cpuCount}\n` +
            `**CPU Model:** ${cpuModel.substring(0, 30)}...\n` +
            `**Node.js:** ${process.version}\n` +
            `**PID:** ${process.pid}`,
          inline: false,
        },
        {
          name: '📁 Cache Sizes',
          value:
            `**Guilds:** ${client.guilds.cache.size}\n` +
            `**Users:** ${client.users.cache.size}\n` +
            `**Channels:** ${client.channels.cache.size}\n` +
            `**Emojis:** ${client.emojis.cache.size}\n` +
            `**Roles:** ${client.guilds.cache.reduce((acc, guild) => acc + guild.roles.cache.size, 0)}`,
          inline: true,
        },
        {
          name: '🔧 Environment',
          value:
            `**NODE_ENV:** ${process.env.NODE_ENV || 'production'}\n` +
            `**Shard:** ${client.shard ? client.shard.ids[0] : 'N/A'}\n` +
            `**Ready Since:** <t:${Math.floor(client.readyTimestamp / 1000)}:R>`,
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });

    logger.info(`Owner stats viewed by ${message.author.tag}`);
  },
};
