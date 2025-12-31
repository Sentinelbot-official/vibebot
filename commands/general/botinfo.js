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
      .setColor(0x9b59b6) // Purple vibe!
      .setTitle('🎵 Vibe Bot - Our Story')
      .setDescription(
        `**Not just a bot - a journey!** 🎬\n\n` +
          `Created on **December 31, 2025** live on Twitch with the community. ` +
          `Every feature, every command, and every line of code was written with ` +
          `chat watching, learning, and contributing ideas!\n\n` +
          `From **130 commands** to **220+ commands** - this represents hundreds of ` +
          `hours of collaborative coding, debugging sessions at 3 AM, and an amazing ` +
          `community coming together. 💜\n\n` +
          `**Watch the journey:** https://twitch.tv/projectdraguk`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '📛 Bot Name', value: client.user.username, inline: true },
        { name: '🎬 Origin', value: 'Built Live on Twitch!', inline: true },
        {
          name: '📅 Birthday',
          value: 'Dec 31, 2025',
          inline: true,
        },
        { name: '⏰ Current Uptime', value: uptimeString, inline: true },
        {
          name: '📊 Servers Vibing',
          value: `${client.guilds.cache.size}`,
          inline: true,
        },
        { name: '👥 Community Members', value: `${client.users.cache.size}`, inline: true },
        { name: '⚡ Commands', value: `${commandCount}+`, inline: true },
        {
          name: '🏓 Latency',
          value: `${Math.round(client.ws.ping)}ms`,
          inline: true,
        },
        {
          name: '💾 Memory Usage',
          value: `${memoryUsage} MB`,
          inline: true,
        },
        { name: '🖥️ Platform', value: os.platform(), inline: true },
        { name: '📦 Node.js', value: nodeVersion, inline: true },
        { name: '📚 Discord.js', value: `v${djsVersion}`, inline: true },
        { name: '👨‍💻 Creator', value: 'Airis', inline: true },
        { name: '💜 Built By', value: 'The Community', inline: true },
        { name: '📜 License', value: 'Proprietary', inline: true },
        {
          name: '🎯 Special Features',
          value: '🤖 AI-Powered | 🎮 220+ Commands | 🎨 Mini-Games | 💰 Economy | 🛡️ Auto-Mod',
          inline: false,
        },
        {
          name: '🔗 Links',
          value: `[Twitch Stream](https://twitch.tv/projectdraguk) | [GitHub](https://github.com/Sentinelbot-official/vibebot) | [Invite Bot](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot)`,
          inline: false,
        }
      )
      .setFooter({ text: '💜 Built with love by Airis & The Community | Vibe Bot v2.2.0' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
