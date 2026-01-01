const { EmbedBuilder } = require('discord.js');
const os = require('os');
const branding = require('../../utils/branding');

module.exports = {
  name: 'advanced-stats',
  aliases: ['advstats', 'systeminfo', 'sysinfo'],
  description: 'Advanced bot and system statistics',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const client = message.client;

    // System info
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    // Bot stats
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;

    // Calculate messages per second
    const messagesProcessed = client.ws.totalShardCount || 0;
    const avgLatency = client.ws.ping;

    // CPU info
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCores = cpus.length;
    const cpuUsage =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b);
        const idle = cpu.times.idle;
        return acc + (100 - (idle / total) * 100);
      }, 0) / cpuCores;

    // Guild stats
    const totalMembers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );
    const totalChannels = client.channels.cache.size;
    const textChannels = client.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = client.channels.cache.filter(c => c.type === 2).size;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('📊 Advanced Bot Statistics')
      .setDescription('Detailed system and bot performance metrics')
      .addFields(
        {
          name: '🤖 Bot Information',
          value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${totalMembers.toLocaleString()}\n**Commands:** ${client.commands.size}\n**Uptime:** ${days}d ${hours}h ${minutes}m`,
          inline: true,
        },
        {
          name: '📡 Network',
          value: `**Ping:** ${avgLatency}ms\n**Shards:** ${client.ws.totalShardCount || 1}\n**WebSocket:** ${client.ws.status === 0 ? '🟢 Ready' : '🔴 Disconnected'}`,
          inline: true,
        },
        {
          name: '💾 Memory',
          value: `**Bot Usage:** ${memUsage} MB\n**System Used:** ${usedMem} GB\n**System Free:** ${freeMem} GB\n**Total:** ${totalMem} GB`,
          inline: true,
        },
        {
          name: '🖥️ CPU',
          value: `**Model:** ${cpuModel.substring(0, 30)}\n**Cores:** ${cpuCores}\n**Usage:** ${cpuUsage.toFixed(2)}%\n**Platform:** ${os.platform()}`,
          inline: true,
        },
        {
          name: '📺 Channels',
          value: `**Total:** ${totalChannels}\n**Text:** ${textChannels}\n**Voice:** ${voiceChannels}`,
          inline: true,
        },
        {
          name: '📦 Process',
          value: `**Node.js:** ${process.version}\n**Discord.js:** v${require('discord.js').version}\n**PID:** ${process.pid}`,
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
