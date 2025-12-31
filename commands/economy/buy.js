const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'buy',
  aliases: ['purchase'],
  description: 'Buy an item from the shop',
  usage: '<itemId> [amount]',
  category: 'economy',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!args[0]) {
      return message.reply(
        '❌ Please specify an item ID! Use `!shop` to see items.'
      );
    }

    const itemId = args[0].toLowerCase();
    const amount = parseInt(args[1]) || 1;

    if (amount < 1 || amount > 100) {
      return message.reply('❌ Amount must be between 1 and 100!');
    }

    // Default shop items
    const defaultShopItems = {
      fishing_rod: {
        id: 'fishing_rod',
        name: '🎣 Fishing Rod',
        price: 500,
        type: 'tool',
      },
      hunting_rifle: {
        id: 'hunting_rifle',
        name: '🔫 Hunting Rifle',
        price: 750,
        type: 'tool',
      },
      lucky_coin: {
        id: 'lucky_coin',
        name: '🍀 Lucky Coin',
        price: 1000,
        type: 'item',
      },
      bank_note: {
        id: 'bank_note',
        name: '💳 Bank Note',
        price: 2500,
        type: 'item',
      },
      trophy: {
        id: 'trophy',
        name: '🏆 Trophy',
        price: 5000,
        type: 'collectible',
      },
      crown: {
        id: 'crown',
        name: '👑 Crown',
        price: 10000,
        type: 'collectible',
      },
      laptop: { id: 'laptop', name: '💻 Laptop', price: 3000, type: 'tool' },
      car: { id: 'car', name: '🚗 Car', price: 15000, type: 'vehicle' },
      house: { id: 'house', name: '🏠 House', price: 50000, type: 'property' },
      yacht: { id: 'yacht', name: '🛥️ Yacht', price: 100000, type: 'vehicle' },
    };

    // Get custom shop items or use defaults
    const customShopItems = db.get('shop', message.guild.id) || {};
    const shopItems = { ...defaultShopItems, ...customShopItems };
    const item = shopItems[itemId];

    if (!item) {
      return message.reply(
        '❌ Item not found! Use `shop` to see available items.'
      );
    }

    // Check stock (only for custom items)
    if (item.stock !== undefined && item.stock !== -1 && item.stock < amount) {
      return message.reply(
        `❌ Not enough stock! Only ${item.stock} available.`
      );
    }

    const totalPrice = item.price * amount;

    // Get user economy
    const economy = db.get('economy', message.author.id) || {
      wallet: 0,
      bank: 0,
    };

    if (economy.wallet < totalPrice) {
      return message.reply(
        `❌ You don't have enough coins! You need ${totalPrice.toLocaleString()} coins in your wallet.`
      );
    }

    // Deduct coins
    economy.wallet -= totalPrice;
    db.set('economy', message.author.id, economy);

    // Update stock (only for custom items)
    if (item.stock !== undefined && item.stock !== -1) {
      item.stock -= amount;
      customShopItems[itemId] = item;
      db.set('shop', message.guild.id, customShopItems);
    }

    // Add to inventory
    const inventory = db.get('inventory', message.author.id) || {};
    const userGuildInv = inventory[message.guild.id] || {};

    if (!userGuildInv[itemId]) {
      userGuildInv[itemId] = { ...item, quantity: 0 };
    }
    userGuildInv[itemId].quantity += amount;

    inventory[message.guild.id] = userGuildInv;
    db.set('inventory', message.author.id, inventory);

    // Handle role items
    if (item.type === 'role' && item.roleId) {
      const role = message.guild.roles.cache.get(item.roleId);
      if (role) {
        await message.member.roles.add(role).catch(() => {});
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Purchase Successful!')
      .setDescription(
        `You bought **${amount}x ${item.name}** for **${totalPrice.toLocaleString()} coins**!`
      )
      .addFields({
        name: '💰 New Balance',
        value: `${economy.wallet.toLocaleString()} coins`,
        inline: true,
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
