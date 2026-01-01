const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'emojis',
  aliases: ['emojilist', 'serveremojis'],
  description: 'List all server emojis',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  execute(message, args) {
    const emojis = message.guild.emojis.cache;

    if (emojis.size === 0) {
      return message.reply('❌ This server has no custom emojis!');
    }

    const regularEmojis = emojis.filter(e => !e.animated);
    const animatedEmojis = emojis.filter(e => e.animated);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle(`${message.guild.name} Emojis`)
      .setDescription(`Total: **${emojis.size}** emojis`)
      .setTimestamp();

    if (regularEmojis.size > 0) {
      const regularList = regularEmojis.map(e => `${e}`).join(' ');
      embed.addFields({
        name: `Regular Emojis (${regularEmojis.size})`,
        value: regularList.length > 1024 ? 'Too many to display' : regularList,
        inline: false,
      });
    }

    if (animatedEmojis.size > 0) {
      const animatedList = animatedEmojis.map(e => `${e}`).join(' ');
      embed.addFields({
        name: `Animated Emojis (${animatedEmojis.size})`,
        value:
          animatedList.length > 1024 ? 'Too many to display' : animatedList,
        inline: false,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
