const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'shop',
  description: 'View the shop and available items',
  usage: '[page]',
  aliases: ['store', 'market'],
  category: 'economy',
  cooldown: 3,
  async execute(message, args) {
    // Get shop items
    const shopItems = [
      {
        id: 'fishing_rod',
        name: '🎣 Fishing Rod',
        description: 'Catch more fish!',
        price: 500,
        type: 'tool',
      },
      {
        id: 'hunting_rifle',
        name: '🔫 Hunting Rifle',
        description: 'Hunt bigger game!',
        price: 750,
        type: 'tool',
      },
      {
        id: 'lucky_coin',
        name: '🍀 Lucky Coin',
        description: 'Increases your luck in gambling!',
        price: 1000,
        type: 'item',
      },
      {
        id: 'bank_note',
        name: '💳 Bank Note',
        description: 'Increases your bank capacity by 10,000!',
        price: 2500,
        type: 'item',
      },
      {
        id: 'trophy',
        name: '🏆 Trophy',
        description: 'Show off your wealth!',
        price: 5000,
        type: 'collectible',
      },
      {
        id: 'crown',
        name: '👑 Crown',
        description: 'The ultimate flex!',
        price: 10000,
        type: 'collectible',
      },
      {
        id: 'laptop',
        name: '💻 Laptop',
        description: 'Work from anywhere!',
        price: 3000,
        type: 'tool',
      },
      {
        id: 'car',
        name: '🚗 Car',
        description: 'Get around faster!',
        price: 15000,
        type: 'vehicle',
      },
      {
        id: 'house',
        name: '🏠 House',
        description: 'Your own property!',
        price: 50000,
        type: 'property',
      },
      {
        id: 'yacht',
        name: '🛥️ Yacht',
        description: 'Live in luxury!',
        price: 100000,
        type: 'vehicle',
      },
    ];

    const itemsPerPage = 5;
    const page = parseInt(args[0]) || 1;
    const totalPages = Math.ceil(shopItems.length / itemsPerPage);

    if (page < 1 || page > totalPages) {
      return message.reply(`❌ Invalid page! Please choose between 1 and ${totalPages}.`);
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = shopItems.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏪 Shop')
      .setDescription(
        'Use `buy <item_id>` to purchase an item!\n' +
          'Use `inventory` to view your items.\n\n'
      )
      .setFooter({ text: `Page ${page}/${totalPages}` })
      .setTimestamp();

    pageItems.forEach(item => {
      embed.addFields({
        name: `${item.name} - ${item.price} coins`,
        value: `${item.description}\nID: \`${item.id}\` | Type: ${item.type}`,
        inline: false,
      });
    });

    message.reply({ embeds: [embed] });
  },
};
