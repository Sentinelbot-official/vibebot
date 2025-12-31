const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');
const branding = require('../../utils/branding');

// Available businesses
const BUSINESSES = {
  cafe: {
    name: '☕ Coffee Café',
    cost: 50000,
    income: { min: 500, max: 1500 },
    emoji: '☕',
  },
  restaurant: {
    name: '🍽️ Restaurant',
    cost: 100000,
    income: { min: 1000, max: 3000 },
    emoji: '🍽️',
  },
  gym: {
    name: '💪 Fitness Gym',
    cost: 150000,
    income: { min: 1500, max: 4000 },
    emoji: '💪',
  },
  hotel: {
    name: '🏨 Luxury Hotel',
    cost: 250000,
    income: { min: 3000, max: 7000 },
    emoji: '🏨',
  },
  casino: {
    name: '🎰 Casino',
    cost: 500000,
    income: { min: 5000, max: 15000 },
    emoji: '🎰',
  },
  tech: {
    name: '💻 Tech Startup',
    cost: 750000,
    income: { min: 10000, max: 25000 },
    emoji: '💻',
  },
};

module.exports = {
  name: 'business',
  description: 'Own and manage businesses (VIP only)',
  usage: '//business <buy/sell/collect/list/upgrade> [type]',
  aliases: ['biz', 'company'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const guildId = message.guild.id;

    // Check VIP
    if (!premiumPerks.hasFeature(guildId, 'custom_commands')) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ VIP Required')
        .setDescription(
          'Business ownership is a **VIP-exclusive** feature!\n\n' +
            '**VIP Benefits:**\n' +
            '• Own virtual businesses\n' +
            '• Passive income generation\n' +
            '• Stock market access\n' +
            '• AI chatbot\n' +
            '• Custom commands\n\n' +
            'Use `//premium` to upgrade!'
        )
        .setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    const action = args[0]?.toLowerCase();

    if (
      !action ||
      !['buy', 'sell', 'collect', 'list', 'upgrade', 'shop'].includes(action)
    ) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🏢 Business Management')
        .setDescription(
          '**Own businesses and earn passive income!**\n\n' +
            '**Commands:**\n' +
            '`//business shop` - View available businesses\n' +
            '`//business buy <type>` - Buy a business\n' +
            '`//business sell <type>` - Sell a business\n' +
            '`//business collect` - Collect income from all businesses\n' +
            '`//business list` - View your businesses\n' +
            '`//business upgrade <type>` - Upgrade a business\n\n' +
            '**Income:**\n' +
            'Collect income every 6 hours from your businesses!'
        )
        .setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    if (action === 'shop') {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🏪 Business Shop')
        .setDescription(
          '**Available Businesses**\n\nBuy businesses to earn passive income!'
        )
        .setTimestamp();

      for (const [type, business] of Object.entries(BUSINESSES)) {
        embed.addFields({
          name: `${business.emoji} ${business.name}`,
          value:
            `**Cost:** ${business.cost.toLocaleString()} coins\n` +
            `**Income:** ${business.income.min.toLocaleString()} - ${business.income.max.toLocaleString()} coins/6h\n` +
            `**ID:** \`${type}\``,
          inline: true,
        });
      }

      embed.setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const type = args[1]?.toLowerCase();

      if (!type || !BUSINESSES[type]) {
        return message.reply(
          `❌ Invalid business type! Available: ${Object.keys(BUSINESSES).join(', ')}\nUse \`//business shop\` to see details.`
        );
      }

      const business = BUSINESSES[type];

      // Check if already owned
      const businesses = db.get('businesses', message.author.id) || {};
      if (businesses[type]) {
        return message.reply(`❌ You already own a ${business.name}!`);
      }

      // Get user economy
      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      if (economy.coins < business.cost) {
        return message.reply(
          `❌ You don't have enough coins! You need ${business.cost.toLocaleString()} coins.`
        );
      }

      // Deduct coins
      economy.coins -= business.cost;
      db.set('economy', message.author.id, economy);

      // Add business
      businesses[type] = {
        level: 1,
        purchasedAt: Date.now(),
        lastCollect: Date.now(),
      };
      db.set('businesses', message.author.id, businesses);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Business Purchased!')
        .setDescription(
          `**Business:** ${business.emoji} ${business.name}\n` +
            `**Cost:** ${business.cost.toLocaleString()} coins\n` +
            `**Income:** ${business.income.min.toLocaleString()} - ${business.income.max.toLocaleString()} coins/6h\n\n` +
            `**New Balance:** ${economy.coins.toLocaleString()} coins\n\n` +
            `Use \`//business collect\` to collect income every 6 hours!`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'sell') {
      const type = args[1]?.toLowerCase();

      if (!type || !BUSINESSES[type]) {
        return message.reply(
          `❌ Invalid business type! Use \`//business list\` to see your businesses.`
        );
      }

      const businesses = db.get('businesses', message.author.id) || {};
      if (!businesses[type]) {
        return message.reply(`❌ You don't own a ${BUSINESSES[type].name}!`);
      }

      const business = BUSINESSES[type];
      const level = businesses[type].level;
      const sellPrice = Math.floor(business.cost * 0.7 * level);

      // Add coins
      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };
      economy.coins += sellPrice;
      db.set('economy', message.author.id, economy);

      // Remove business
      delete businesses[type];
      db.set('businesses', message.author.id, businesses);

      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('✅ Business Sold!')
        .setDescription(
          `**Business:** ${business.emoji} ${business.name} (Level ${level})\n` +
            `**Sold for:** ${sellPrice.toLocaleString()} coins\n\n` +
            `**New Balance:** ${economy.coins.toLocaleString()} coins`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'collect') {
      const businesses = db.get('businesses', message.author.id) || {};

      if (Object.keys(businesses).length === 0) {
        return message.reply("❌ You don't own any businesses yet!");
      }

      const collectInterval = 6 * 60 * 60 * 1000; // 6 hours
      let totalIncome = 0;
      const collected = [];

      for (const [type, data] of Object.entries(businesses)) {
        const timeSinceCollect = Date.now() - data.lastCollect;

        if (timeSinceCollect >= collectInterval) {
          const business = BUSINESSES[type];
          const income =
            Math.floor(
              Math.random() * (business.income.max - business.income.min + 1)
            ) +
            business.income.min * data.level;

          totalIncome += income;
          data.lastCollect = Date.now();
          collected.push({
            type,
            name: business.name,
            emoji: business.emoji,
            income,
          });
        }
      }

      if (totalIncome === 0) {
        const nextCollect = Math.min(
          ...Object.values(businesses).map(b => b.lastCollect + collectInterval)
        );
        const timeLeft = nextCollect - Date.now();
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

        return message.reply(
          `⏱️ No income to collect yet! Come back in **${hours}h ${minutes}m**`
        );
      }

      // Add coins
      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };
      economy.coins += totalIncome;
      db.set('economy', message.author.id, economy);
      db.set('businesses', message.author.id, businesses);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('💰 Income Collected!')
        .setDescription(
          '**Collected from:**\n' +
            collected
              .map(
                b => `${b.emoji} ${b.name}: ${b.income.toLocaleString()} coins`
              )
              .join('\n') +
            `\n\n**Total Income:** ${totalIncome.toLocaleString()} coins\n` +
            `**New Balance:** ${economy.coins.toLocaleString()} coins`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'list') {
      const businesses = db.get('businesses', message.author.id) || {};

      if (Object.keys(businesses).length === 0) {
        return message.reply(
          "📭 You don't own any businesses yet!\nUse `//business shop` to buy one."
        );
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🏢 Your Businesses')
        .setDescription('**Your Business Empire**')
        .setTimestamp();

      const collectInterval = 6 * 60 * 60 * 1000;

      for (const [type, data] of Object.entries(businesses)) {
        const business = BUSINESSES[type];
        const timeSinceCollect = Date.now() - data.lastCollect;
        const canCollect = timeSinceCollect >= collectInterval;
        const timeLeft = canCollect ? 0 : collectInterval - timeSinceCollect;
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

        embed.addFields({
          name: `${business.emoji} ${business.name}`,
          value:
            `**Level:** ${data.level}\n` +
            `**Income:** ${(business.income.min * data.level).toLocaleString()} - ${(business.income.max * data.level).toLocaleString()} coins/6h\n` +
            `**Status:** ${canCollect ? '✅ Ready to collect!' : `⏱️ ${hours}h ${minutes}m`}`,
          inline: true,
        });
      }

      embed.setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    if (action === 'upgrade') {
      const type = args[1]?.toLowerCase();

      if (!type || !BUSINESSES[type]) {
        return message.reply(
          `❌ Invalid business type! Use \`//business list\` to see your businesses.`
        );
      }

      const businesses = db.get('businesses', message.author.id) || {};
      if (!businesses[type]) {
        return message.reply(`❌ You don't own a ${BUSINESSES[type].name}!`);
      }

      const business = BUSINESSES[type];
      const currentLevel = businesses[type].level;
      const upgradeCost = business.cost * currentLevel;

      // Get user economy
      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      if (economy.coins < upgradeCost) {
        return message.reply(
          `❌ You don't have enough coins! Upgrade cost: ${upgradeCost.toLocaleString()} coins.`
        );
      }

      // Deduct coins
      economy.coins -= upgradeCost;
      db.set('economy', message.author.id, economy);

      // Upgrade business
      businesses[type].level += 1;
      db.set('businesses', message.author.id, businesses);

      const newLevel = businesses[type].level;

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('⬆️ Business Upgraded!')
        .setDescription(
          `**Business:** ${business.emoji} ${business.name}\n` +
            `**Level:** ${currentLevel} → ${newLevel}\n` +
            `**Cost:** ${upgradeCost.toLocaleString()} coins\n\n` +
            `**New Income:** ${(business.income.min * newLevel).toLocaleString()} - ${(business.income.max * newLevel).toLocaleString()} coins/6h\n\n` +
            `**New Balance:** ${economy.coins.toLocaleString()} coins`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
