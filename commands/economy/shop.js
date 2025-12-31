const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'shop',
  aliases: ['store'],
  description: 'View the server shop',
  category: 'economy',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const shopItems = db.get('shop', message.guild.id) || {};

    if (Object.keys(shopItems).length === 0) {
      return message.reply(
        '❌ The shop is empty! Admins can add items with `!additem`'
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`🛒 ${message.guild.name} Shop`)
      .setDescription('Use `!buy <item>` to purchase an item!')
      .setTimestamp();

    for (const [itemId, item] of Object.entries(shopItems)) {
      embed.addFields({
        name: `${item.name} - ${item.price.toLocaleString()} coins`,
        value: `${item.description}\nStock: ${item.stock === -1 ? '∞' : item.stock}\nID: \`${itemId}\``,
        inline: true,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
