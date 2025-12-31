const { EmbedBuilder, version: djsVersion } = require('discord.js');
const { version: nodeVersion } = process;
const os = require('os');

module.exports = {
  name: 'botinfo',
  aliases: ['about', 'info'],
  description: 'Display information about the bot',
  category: 'general',
  cooldown: 5,
  execute(message, args) {
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

    // Count commands
    const commandCount = client.commands.size;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🤖 Bot Information')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '📛 Bot Name', value: client.user.username, inline: true },
        { name: '🆔 Bot ID', value: client.user.id, inline: true },
        {
          name: '📅 Created',
          value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: '⏰ Uptime', value: uptimeString, inline: true },
        {
          name: '📊 Servers',
          value: `${client.guilds.cache.size}`,
          inline: true,
        },
        { name: '👥 Users', value: `${client.users.cache.size}`, inline: true },
        { name: '📝 Commands', value: `${commandCount}`, inline: true },
        {
          name: '🏓 Ping',
          value: `${Math.round(client.ws.ping)}ms`,
          inline: true,
        },
        {
          name: '💾 Memory',
          value: `${memoryUsage} MB / ${totalMemory} GB`,
          inline: true,
        },
        { name: '🖥️ Platform', value: os.platform(), inline: true },
        { name: '📦 Node.js', value: nodeVersion, inline: true },
        { name: '📚 Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '👨‍💻 Developer', value: 'Airis', inline: true },
        { name: '📜 License', value: 'MIT', inline: true },
        {
          name: '🔗 Links',
          value: `[Support Server](https://discord.gg/COMING_SOON) | [Invite Bot](https://discord.com/oauth2/authorize?client_id=${
            client.user.id
          }&permissions=8&scope=bot)`,
          inline: false,
        }
      )
      .setFooter({ text: 'Vibe Bot v1.0.0' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
