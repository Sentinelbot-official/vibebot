const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');

module.exports = {
  name: 'shop',
  description: 'View the shop and available items (Premium users get discounts!)',
  usage: '[page]',
  aliases: ['store', 'market'],
  category: 'economy',
  cooldown: 3,
  async execute(message, args) {
    const guildId = message.guild.id;
    const discount = premiumPerks.getShopDiscount(guildId);
    const tierBadge = premiumPerks.getTierBadge(guildId);
    const tierName = premiumPerks.getTierDisplayName(guildId);

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
      // Premium-exclusive items
      {
        id: 'premium_badge',
        name: '💎 Premium Badge',
        description: 'Exclusive Premium collectible!',
        price: 25000,
        type: 'collectible',
        premiumOnly: true,
      },
      {
        id: 'vip_pass',
        name: '👑 VIP Pass',
        description: 'The ultimate status symbol!',
        price: 50000,
        type: 'collectible',
        vipOnly: true,
      },
      {
        id: 'private_jet',
        name: '✈️ Private Jet',
        description: 'Travel in style! (VIP only)',
        price: 500000,
        type: 'vehicle',
        vipOnly: true,
      },
    ];

    // Filter items based on premium status
    const hasPremium = premiumPerks.hasFeature(guildId, 'premium_badge');
    const hasVIP = premiumPerks.hasFeature(guildId, 'custom_commands');

    const availableItems = shopItems.filter(item => {
      if (item.vipOnly && !hasVIP) return false;
      if (item.premiumOnly && !hasPremium) return false;
      return true;
    });

    const itemsPerPage = 5;
    const page = parseInt(args[0]) || 1;
    const totalPages = Math.ceil(availableItems.length / itemsPerPage);

    if (page < 1 || page > totalPages) {
      return message.reply(
        `❌ Invalid page! Please choose between 1 and ${totalPages}.`
      );
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = availableItems.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`${tierBadge} Shop`)
      .setDescription(
        'Use `buy <item_id>` to purchase an item!\n' +
          'Use `inventory` to view your items.\n\n' +
          (discount > 0
            ? `${tierBadge} **${tierName} Discount:** ${Math.round(discount * 100)}% off all items!\n\n`
            : '')
      )
      .setFooter({
        text: `Page ${page}/${totalPages}${discount === 0 ? ' | Upgrade to Premium for discounts!' : ''}`,
      })
      .setTimestamp();

    pageItems.forEach(item => {
      const originalPrice = item.price;
      const discountedPrice = premiumPerks.applyShopDiscount(
        guildId,
        originalPrice
      );
      const priceDisplay =
        discount > 0
          ? `~~${originalPrice.toLocaleString()}~~ **${discountedPrice.toLocaleString()}** coins`
          : `${originalPrice.toLocaleString()} coins`;

      embed.addFields({
        name: `${item.name} - ${priceDisplay}`,
        value: `${item.description}\nID: \`${item.id}\` | Type: ${item.type}${
          item.premiumOnly ? ' | 💎 Premium' : ''
        }${item.vipOnly ? ' | 👑 VIP' : ''}`,
        inline: false,
      });
    });

    // Show locked premium items
    const lockedItems = shopItems.filter(item => {
      if (item.vipOnly && !hasVIP) return true;
      if (item.premiumOnly && !hasPremium) return true;
      return false;
    });

    if (lockedItems.length > 0 && page === totalPages) {
      const lockedText = lockedItems
        .map(
          item =>
            `${item.name} - ${item.price.toLocaleString()} coins ${item.vipOnly ? '👑' : '💎'}`
        )
        .join('\n');
      embed.addFields({
        name: '🔒 Premium Items (Locked)',
        value: lockedText + '\n\nUpgrade to unlock these items!',
        inline: false,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
