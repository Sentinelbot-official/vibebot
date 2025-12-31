const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'servericon',
  aliases: ['guildicon', 'icon'],
  description: 'Get the server icon',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  execute(message, args) {
    const iconURL = message.guild.iconURL({ dynamic: true, size: 4096 });

    if (!iconURL) {
      return message.reply('❌ This server has no icon!');
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle(`${message.guild.name} Icon`)
      .setImage(iconURL)
      .addFields({
        name: 'Download',
        value: `[Click Here](${iconURL})`,
        inline: true,
      });

    message.reply({ embeds: [embed] });
  },
};
