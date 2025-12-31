const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

const businessTypes = {
  lemonade: { name: 'Lemonade Stand', cost: 5000, income: 100, emoji: '🍋' },
  cafe: { name: 'Coffee Cafe', cost: 25000, income: 500, emoji: '☕' },
  restaurant: { name: 'Restaurant', cost: 100000, income: 2500, emoji: '🍽️' },
  hotel: { name: 'Hotel', cost: 500000, income: 15000, emoji: '🏨' },
  casino: { name: 'Casino', cost: 2000000, income: 100000, emoji: '🎰' },
};

module.exports = {
  name: 'business',
  description: 'Own and manage virtual businesses',
  usage: '<buy/list/collect/upgrade/sell> [type]',
  aliases: ['biz', 'company'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'list') {
      const list = Object.entries(businessTypes)
        .map(
          ([key, biz]) =>
            `${biz.emoji} **${biz.name}**\n` +
            `Cost: ${biz.cost.toLocaleString()} coins\n` +
            `Income: ${biz.income.toLocaleString()} coins/hour\n` +
            `ID: \`${key}\``
        )
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🏢 Available Businesses')
        .setDescription(list)
        .setFooter({ text: 'Use "business buy <id>" to purchase' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const type = args[1]?.toLowerCase();

      if (!type || !businessTypes[type]) {
        const types = Object.keys(businessTypes).join(', ');
        return message.reply(
          `❌ Invalid business type!\nAvailable: ${types}\nUsage: \`business buy <type>\``
        );
      }

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };
      const businesses = db.get('businesses', message.author.id) || {
        businesses: [],
      };

      const business = businessTypes[type];

      // Check if already owns this type
      if (businesses.businesses.some(b => b.type === type)) {
        return message.reply(
          `❌ You already own a ${business.name}! Upgrade it instead.`
        );
      }

      if (economy.coins < business.cost) {
        return message.reply(
          `❌ You need ${business.cost.toLocaleString()} coins to buy a ${business.name}!\nYou have: ${economy.coins.toLocaleString()} coins`
        );
      }

      economy.coins -= business.cost;
      businesses.businesses.push({
        type,
        level: 1,
        purchasedAt: Date.now(),
        lastCollect: Date.now(),
      });

      db.set('economy', message.author.id, economy);
      db.set('businesses', message.author.id, businesses);

      return message.reply(
        `✅ Purchased ${business.emoji} **${business.name}**!\n` +
          `Income: ${business.income.toLocaleString()} coins/hour\n` +
          `Use \`business collect\` to collect earnings!`
      );
    }

    if (action === 'collect') {
      const businesses = db.get('businesses', message.author.id) || {
        businesses: [],
      };

      if (!businesses.businesses.length) {
        return message.reply(
          "❌ You don't own any businesses!\nUse `business list` to see available businesses."
        );
      }

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      let totalEarnings = 0;
      const now = Date.now();

      for (const biz of businesses.businesses) {
        const business = businessTypes[biz.type];
        const hoursSinceCollect = (now - biz.lastCollect) / (1000 * 60 * 60);
        const maxHours = 24; // Max 24 hours of earnings

        const hoursToCollect = Math.min(hoursSinceCollect, maxHours);
        const earnings = Math.floor(
          business.income * hoursToCollect * biz.level
        );

        totalEarnings += earnings;
        biz.lastCollect = now;
      }

      if (totalEarnings === 0) {
        return message.reply(
          '❌ No earnings to collect yet! Wait at least a few minutes.'
        );
      }

      economy.coins += totalEarnings;
      db.set('economy', message.author.id, economy);
      db.set('businesses', message.author.id, businesses);

      return message.reply(
        `💰 Collected **${totalEarnings.toLocaleString()} coins** from your businesses!\n` +
          `New balance: ${economy.coins.toLocaleString()} coins`
      );
    }

    if (action === 'mylist' || action === 'owned') {
      const businesses = db.get('businesses', message.author.id) || {
        businesses: [],
      };

      if (!businesses.businesses.length) {
        return message.reply("❌ You don't own any businesses yet!");
      }

      const list = businesses.businesses
        .map(biz => {
          const business = businessTypes[biz.type];
          const hoursSinceCollect =
            (Date.now() - biz.lastCollect) / (1000 * 60 * 60);
          const earnings = Math.floor(
            Math.min(hoursSinceCollect, 24) * business.income * biz.level
          );

          return (
            `${business.emoji} **${business.name}** (Level ${biz.level})\n` +
            `Income: ${(business.income * biz.level).toLocaleString()} coins/hour\n` +
            `Pending: ${earnings.toLocaleString()} coins`
          );
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🏢 Your Businesses')
        .setDescription(list)
        .setFooter({ text: 'Use "business collect" to collect earnings' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'upgrade') {
      const type = args[1]?.toLowerCase();

      if (!type) {
        return message.reply(
          '❌ Please specify a business type!\nUsage: `business upgrade <type>`'
        );
      }

      const businesses = db.get('businesses', message.author.id) || {
        businesses: [],
      };
      const biz = businesses.businesses.find(b => b.type === type);

      if (!biz) {
        return message.reply(`❌ You don't own a ${type} business!`);
      }

      const business = businessTypes[type];
      const upgradeCost = Math.floor(business.cost * biz.level * 0.5);

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      if (economy.coins < upgradeCost) {
        return message.reply(
          `❌ Upgrade costs ${upgradeCost.toLocaleString()} coins!\nYou have: ${economy.coins.toLocaleString()} coins`
        );
      }

      economy.coins -= upgradeCost;
      biz.level++;

      db.set('economy', message.author.id, economy);
      db.set('businesses', message.author.id, businesses);

      return message.reply(
        `✅ Upgraded ${business.emoji} **${business.name}** to level ${biz.level}!\n` +
          `New income: ${(business.income * biz.level).toLocaleString()} coins/hour`
      );
    }

    if (action === 'sell') {
      const type = args[1]?.toLowerCase();

      if (!type) {
        return message.reply(
          '❌ Please specify a business type!\nUsage: `business sell <type>`'
        );
      }

      const businesses = db.get('businesses', message.author.id) || {
        businesses: [],
      };
      const index = businesses.businesses.findIndex(b => b.type === type);

      if (index === -1) {
        return message.reply(`❌ You don't own a ${type} business!`);
      }

      const biz = businesses.businesses[index];
      const business = businessTypes[type];
      const sellPrice = Math.floor(
        (business.cost + business.cost * biz.level * 0.5) * 0.7
      );

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      economy.coins += sellPrice;
      businesses.businesses.splice(index, 1);

      db.set('economy', message.author.id, economy);
      db.set('businesses', message.author.id, businesses);

      return message.reply(
        `✅ Sold ${business.emoji} **${business.name}** for ${sellPrice.toLocaleString()} coins!`
      );
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `business <buy/list/collect/mylist/upgrade/sell>`\n\n' +
        '**Examples:**\n' +
        '`business list` - View available businesses\n' +
        '`business buy cafe` - Buy a business\n' +
        '`business mylist` - View your businesses\n' +
        '`business collect` - Collect earnings\n' +
        '`business upgrade cafe` - Upgrade a business\n' +
        '`business sell cafe` - Sell a business'
    );
  },
};
