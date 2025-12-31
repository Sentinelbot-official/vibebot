const {
  EmbedBuilder,
  version: djsVersion,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { version: nodeVersion } = process;
const os = require('os');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'botinfo',
  aliases: ['about', 'info', 'stats'],
  description: 'Display advanced information about the bot',
  category: 'general',
  cooldown: 5,
  async execute(message, args) {
    const client = message.client;

    // Calculate uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime) % 60;
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Memory usage
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
      2
    );
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const memoryPercent = (
      (process.memoryUsage().heapUsed / os.totalmem()) *
      100
    ).toFixed(2);

    // CPU info
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCores = cpus.length;
    const cpuSpeed = cpus[0].speed;

    // Count commands
    const commandCount = client.commands.size;

    // Calculate total users across all guilds
    const totalUsers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );
    const totalChannels = client.channels.cache.size;

    // Get shard info if sharded
    const shardId = client.shard ? client.shard.ids[0] : 'N/A';
    const totalShards = client.shard ? client.shard.count : 1;

    // Get premium stats
    const premiumServers =
      db.getAll('premium_servers')?.filter(s => s.key !== 'initialized')
        .length || 0;

    // Calculate cache sizes
    const cachedUsers = client.users.cache.size;
    const cachedGuilds = client.guilds.cache.size;
    const cachedChannels = client.channels.cache.size;

    // Get database stats
    const economyUsers = db.getAll('economy')?.length || 0;
    const levelUsers = db.getAll('levels')?.length || 0;

    // System load
    const loadAvg = os.loadavg();

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle(`${branding.emojis.vibe} Vibe Bot - Advanced Statistics`)
      .setAuthor({
        name: branding.getTagline(),
        iconURL: branding.footers.default.iconURL,
      })
      .setDescription(
        `**Not just a bot - a 24/7 journey!** 🔴\n\n` +
          `Created on **December 31, 2025** on a **24/7 LIVE Twitch stream** with the ` +
          `global community. Every feature, every command, and every line of code was ` +
          `written with chat watching, learning, and contributing ideas!\n\n` +
          `**🔴 LIVE NOW (24/7):** https://twitch.tv/projectdraguk`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        {
          name: '📊 Server Statistics',
          value:
            `**Servers:** ${cachedGuilds.toLocaleString()}\n` +
            `**Total Users:** ${totalUsers.toLocaleString()}\n` +
            `**Cached Users:** ${cachedUsers.toLocaleString()}\n` +
            `**Channels:** ${totalChannels.toLocaleString()}\n` +
            `**Premium Servers:** ${premiumServers}`,
          inline: true,
        },
        {
          name: '⚡ Bot Statistics',
          value:
            `**Commands:** ${commandCount}+\n` +
            `**Uptime:** ${uptimeString}\n` +
            `**Latency:** ${Math.round(client.ws.ping)}ms\n` +
            `**Shard:** ${shardId}/${totalShards}\n` +
            `**Version:** v2.5.0`,
          inline: true,
        },
        {
          name: '💾 Memory Usage',
          value:
            `**Used:** ${memoryUsage} MB (${memoryPercent}%)\n` +
            `**Total:** ${totalMemory} GB\n` +
            `**Free:** ${freeMemory} GB\n` +
            `**RSS:** ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\n` +
            `**External:** ${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`,
          inline: true,
        },
        {
          name: '🖥️ System Information',
          value:
            `**Platform:** ${os.platform()} ${os.arch()}\n` +
            `**CPU:** ${cpuModel.substring(0, 30)}...\n` +
            `**Cores:** ${cpuCores} @ ${cpuSpeed}MHz\n` +
            `**Load:** ${loadAvg[0].toFixed(2)}, ${loadAvg[1].toFixed(2)}, ${loadAvg[2].toFixed(2)}\n` +
            `**Hostname:** ${os.hostname()}`,
          inline: true,
        },
        {
          name: '📦 Dependencies',
          value:
            `**Node.js:** ${nodeVersion}\n` +
            `**Discord.js:** v${djsVersion}\n` +
            `**Process ID:** ${process.pid}\n` +
            `**Platform:** ${process.platform}\n` +
            `**Arch:** ${process.arch}`,
          inline: true,
        },
        {
          name: '💾 Database Statistics',
          value:
            `**Economy Users:** ${economyUsers.toLocaleString()}\n` +
            `**Level Users:** ${levelUsers.toLocaleString()}\n` +
            `**Premium Servers:** ${premiumServers}\n` +
            `**Cache Size:** ${cachedGuilds + cachedUsers + cachedChannels} items`,
          inline: true,
        },
        {
          name: '🎯 Features',
          value:
            '🤖 AI-Powered (DALL-E, GPT)\n' +
            '💰 Advanced Economy\n' +
            '📈 Stock Market (VIP)\n' +
            '🏢 Business System (VIP)\n' +
            '🎮 220+ Commands\n' +
            '🛡️ AI Auto-Moderation\n' +
            '📊 Server Analytics (VIP)',
          inline: true,
        },
        {
          name: '💎 Premium System',
          value:
            `**Active Servers:** ${premiumServers}\n` +
            `**Tiers:** Free, Premium, VIP\n` +
            `**Features:** 50+ exclusive perks\n` +
            `**Multipliers:** Up to 3x rewards\n` +
            `**Custom Commands:** VIP feature`,
          inline: true,
        },
        {
          name: '👨‍💻 Development',
          value:
            `**Creator:** Airis\n` +
            `**Built By:** Global 24/7 Community\n` +
            `**License:** Proprietary\n` +
            `**Stream:** 24/7 LIVE on Twitch\n` +
            `**GitHub:** Open Source (View Only)`,
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    // Add buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Watch Live')
        .setStyle(ButtonStyle.Link)
        .setURL('https://twitch.tv/projectdraguk')
        .setEmoji('🔴'),
      new ButtonBuilder()
        .setLabel('GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/Sentinelbot-official/vibebot')
        .setEmoji('💻'),
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=268446806&scope=bot`
        )
        .setEmoji('➕'),
      new ButtonBuilder()
        .setLabel('Premium')
        .setStyle(ButtonStyle.Link)
        .setURL('https://sentinelbot-official.github.io/vibebot/activate.html')
        .setEmoji('💎')
    );

    message.reply({ embeds: [embed], components: [row] });
  },
};
