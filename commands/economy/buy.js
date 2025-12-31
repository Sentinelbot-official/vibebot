const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');

module.exports = {
  name: 'buy',
  aliases: ['purchase'],
  description: 'Buy an item from the shop (Premium users get discounts!)',
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
    const guildId = message.guild.id;

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
      // Premium-exclusive items
      premium_badge: {
        id: 'premium_badge',
        name: '💎 Premium Badge',
        price: 25000,
        type: 'collectible',
        premiumOnly: true,
      },
      vip_pass: {
        id: 'vip_pass',
        name: '👑 VIP Pass',
        price: 50000,
        type: 'collectible',
        vipOnly: true,
      },
      private_jet: {
        id: 'private_jet',
        name: '✈️ Private Jet',
        price: 500000,
        type: 'vehicle',
        vipOnly: true,
      },
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

    // Check premium requirements
    const hasPremium = premiumPerks.hasFeature(guildId, 'premium_badge');
    const hasVIP = premiumPerks.hasFeature(guildId, 'custom_commands');

    if (item.vipOnly && !hasVIP) {
      return message.reply(
        '❌ This item is VIP-exclusive! Upgrade to VIP to purchase it.\nUse `//premium` to learn more!'
      );
    }

    if (item.premiumOnly && !hasPremium) {
      return message.reply(
        '❌ This item is Premium-exclusive! Upgrade to Premium to purchase it.\nUse `//premium` to learn more!'
      );
    }

    // Check stock (only for custom items)
    if (item.stock !== undefined && item.stock !== -1 && item.stock < amount) {
      return message.reply(
        `❌ Not enough stock! Only ${item.stock} available.`
      );
    }

    // Apply premium discount
    const originalPrice = item.price;
    const discountedPrice = premiumPerks.applyShopDiscount(guildId, originalPrice);
    const totalPrice = discountedPrice * amount;
    const savings = (originalPrice - discountedPrice) * amount;

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

    const tierBadge = premiumPerks.getTierBadge(guildId);
    const tierName = premiumPerks.getTierDisplayName(guildId);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`${tierBadge} Purchase Successful!`)
      .setDescription(
        `You bought **${amount}x ${item.name}** for **${totalPrice.toLocaleString()} coins**!${
          savings > 0
            ? `\n\n${tierBadge} **${tierName} Discount:** You saved ${savings.toLocaleString()} coins!`
            : ''
        }`
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
