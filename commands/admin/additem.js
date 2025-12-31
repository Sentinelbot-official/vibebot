const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'additem',
  description: 'Add an item to the shop',
  usage: '<id> <price> <stock> <name> | <description>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return message.reply('❌ You need Administrator permission!');
    }

    if (args.length < 4) {
      return message.reply(
        '❌ Usage: `additem <id> <price> <stock> <name> | <description>`\nExample: `additem vip 1000 10 VIP Role | Get VIP perks!`'
      );
    }

    const itemId = args[0].toLowerCase();
    const price = parseInt(args[1]);
    const stock = parseInt(args[2]);

    if (isNaN(price) || price < 1) {
      return message.reply('❌ Price must be a positive number!');
    }

    if (isNaN(stock) || stock < -1) {
      return message.reply(
        '❌ Stock must be -1 (unlimited) or a positive number!'
      );
    }

    const rest = args.slice(3).join(' ').split('|');
    if (rest.length < 2) {
      return message.reply('❌ Please separate name and description with `|`');
    }

    const name = rest[0].trim();
    const description = rest[1].trim();

    if (name.length > 100 || description.length > 200) {
      return message.reply('❌ Name max 100 chars, description max 200 chars!');
    }

    const shopItems = db.get('shop', message.guild.id) || {};
    shopItems[itemId] = {
      name,
      description,
      price,
      stock,
      type: 'item',
    };

    db.set('shop', message.guild.id, shopItems);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Item Added to Shop!')
      .addFields(
        { name: 'ID', value: itemId, inline: true },
        { name: 'Name', value: name, inline: true },
        {
          name: 'Price',
          value: `${price.toLocaleString()} coins`,
          inline: true,
        },
        {
          name: 'Stock',
          value: stock === -1 ? '∞' : stock.toString(),
          inline: true,
        },
        { name: 'Description', value: description, inline: false }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
