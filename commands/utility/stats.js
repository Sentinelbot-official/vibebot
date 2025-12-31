const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const os = require('os');

module.exports = {
  name: 'stats',
  aliases: ['botstats', 'botinfo'],
  description: 'View bot statistics',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime) % 60;

    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const memUsage = process.memoryUsage();
    const memUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const memTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

    const totalGuilds = message.client.guilds.cache.size;
    const totalUsers = message.client.guilds.cache.reduce(
      (a, g) => a + g.memberCount,
      0
    );
    const totalChannels = message.client.channels.cache.size;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🤖 Vibe Bot Statistics')
      .setThumbnail(message.client.user.displayAvatarURL())
      .addFields(
        { name: '⏰ Uptime', value: uptimeStr, inline: true },
        {
          name: '💾 Memory',
          value: `${memUsed}MB / ${memTotal}MB`,
          inline: true,
        },
        { name: '🖥️ Platform', value: os.platform(), inline: true },
        { name: '🏠 Servers', value: `${totalGuilds}`, inline: true },
        {
          name: '👥 Users',
          value: `${totalUsers.toLocaleString()}`,
          inline: true,
        },
        { name: '📺 Channels', value: `${totalChannels}`, inline: true },
        { name: '📡 Ping', value: `${message.client.ws.ping}ms`, inline: true },
        { name: '📦 Node.js', value: process.version, inline: true },
        {
          name: '📚 Discord.js',
          value: require('discord.js').version,
          inline: true,
        }
      )
      .setFooter({ text: 'Vibe Bot v1.0.0 | Made by Airis' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
