const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

const shopCategories = {
  roles: {
    name: '🎭 Roles',
    items: {
      vip: { name: 'VIP Role', price: 10000, description: 'Get VIP perks' },
      premium: {
        name: 'Premium Role',
        price: 25000,
        description: 'Premium features',
      },
      colorful: {
        name: 'Colorful Name',
        price: 5000,
        description: 'Custom colored name',
      },
    },
  },
  items: {
    name: '🎒 Items',
    items: {
      shield: {
        name: 'Protection Shield',
        price: 2000,
        description: 'Protect from rob attempts',
      },
      multiplier: {
        name: '2x Multiplier',
        price: 15000,
        description: '2x coins for 24h',
      },
      lootbox: {
        name: 'Mystery Box',
        price: 5000,
        description: 'Random rewards',
      },
    },
  },
  upgrades: {
    name: '⬆️ Upgrades',
    items: {
      bank_space: {
        name: 'Bank Space +10k',
        price: 8000,
        description: 'Increase bank capacity',
      },
      daily_boost: {
        name: 'Daily Boost',
        price: 12000,
        description: '+50% daily rewards',
      },
      work_boost: {
        name: 'Work Boost',
        price: 10000,
        description: '+30% work earnings',
      },
    },
  },
  cosmetics: {
    name: '✨ Cosmetics',
    items: {
      badge_1: { name: '⭐ Star Badge', price: 3000, description: 'Show off!' },
      badge_2: { name: '🏆 Trophy Badge', price: 5000, description: 'Epic badge' },
      title: {
        name: 'Custom Title',
        price: 20000,
        description: 'Custom profile title',
      },
    },
  },
};

module.exports = {
  name: 'shopnew',
  description: 'Browse the improved shop with categories',
  usage: '[category] or <buy> <category> <item>',
  aliases: ['store', 'market'],
  category: 'economy',
  cooldown: 3,
  async execute(message, args) {
    if (!args.length) {
      // Show all categories
      const categories = Object.entries(shopCategories)
        .map(
          ([key, cat]) =>
            `${cat.name}\n` +
            `Items: ${Object.keys(cat.items).length}\n` +
            `Use: \`shopnew ${key}\``
        )
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🏪 Shop Categories')
        .setDescription(categories)
        .setFooter({ text: 'Use "shopnew <category>" to browse' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const action = args[0].toLowerCase();

    if (action === 'buy') {
      const category = args[1]?.toLowerCase();
      const itemId = args[2]?.toLowerCase();

      if (!category || !itemId) {
        return message.reply(
          '❌ Usage: `shopnew buy <category> <item>`\nExample: `shopnew buy roles vip`'
        );
      }

      const cat = shopCategories[category];
      if (!cat) {
        return message.reply(`❌ Category "${category}" not found!`);
      }

      const item = cat.items[itemId];
      if (!item) {
        return message.reply(`❌ Item "${itemId}" not found in ${cat.name}!`);
      }

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      if (economy.coins < item.price) {
        return message.reply(
          `❌ You need ${item.price.toLocaleString()} coins!\nYou have: ${economy.coins.toLocaleString()} coins`
        );
      }

      // Check if already owns
      const inventory = db.get('inventory', message.author.id) || { items: [] };
      if (inventory.items.some(i => i.id === itemId)) {
        return message.reply(`❌ You already own **${item.name}**!`);
      }

      economy.coins -= item.price;
      inventory.items.push({
        id: itemId,
        name: item.name,
        category,
        purchasedAt: Date.now(),
      });

      db.set('economy', message.author.id, economy);
      db.set('inventory', message.author.id, inventory);

      return message.reply(
        `✅ Purchased **${item.name}** for ${item.price.toLocaleString()} coins!\n` +
          `New balance: ${economy.coins.toLocaleString()} coins`
      );
    }

    // Show category items
    const category = args[0].toLowerCase();
    const cat = shopCategories[category];

    if (!cat) {
      const categories = Object.keys(shopCategories).join(', ');
      return message.reply(
        `❌ Invalid category!\nAvailable: ${categories}\nUsage: \`shopnew <category>\``
      );
    }

    const items = Object.entries(cat.items)
      .map(
        ([key, item]) =>
          `**${item.name}** - ${item.price.toLocaleString()} coins\n` +
          `${item.description}\n` +
          `ID: \`${key}\``
      )
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`${cat.name} Shop`)
      .setDescription(items)
      .setFooter({ text: 'Use "shopnew buy <category> <item>" to purchase' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
