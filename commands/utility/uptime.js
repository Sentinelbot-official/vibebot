const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'uptime',
  description: 'Show bot uptime',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime) % 60;

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('⏰ Bot Uptime')
      .setDescription(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      .addFields({
        name: 'Started',
        value: `<t:${Math.floor((Date.now() - uptime * 1000) / 1000)}:R>`,
        inline: true,
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
