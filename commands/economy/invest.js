const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'invest',
  aliases: ['portfolio', 'investments'],
  description: 'Manage investment portfolios',
  usage: '<buy/sell/portfolio/market>',
  category: 'economy',
  cooldown: 10,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['buy', 'sell', 'portfolio', 'market'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('📈 Investment Portfolio')
        .setDescription(
          '**Grow your wealth through smart investments!**\n\n' +
            '**Commands:**\n' +
            '`//invest market` - View investment options\n' +
            '`//invest buy <asset> <amount>` - Buy investment\n' +
            '`//invest sell <asset> <amount>` - Sell investment\n' +
            '`//invest portfolio` - View your portfolio\n\n' +
            '**Assets:**\n' +
            '• 📊 Index Funds (Low risk, stable returns)\n' +
            '• 💎 Precious Metals (Medium risk)\n' +
            '• 🏢 Real Estate (High value, slow growth)\n' +
            '• 🚀 Tech Stocks (High risk, high reward)'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'market') {
      const assets = getAssetPrices();

      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('📈 Investment Market')
        .setDescription(
          '**Current Prices & Performance:**\n\n' +
            Object.entries(assets)
              .map(
                ([key, asset]) =>
                  `**${asset.emoji} ${asset.name}**\n` +
                  `💰 Price: ${branding.formatNumber(asset.price)} coins\n` +
                  `📊 Risk: ${asset.risk}\n` +
                  `📈 Avg Return: ${asset.avgReturn}%\n` +
                  `${asset.trend > 0 ? '📈' : '📉'} ${Math.abs(asset.trend).toFixed(1)}% ${asset.trend > 0 ? 'up' : 'down'}`
              )
              .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const [, assetKey, amountStr] = args;
      const amount = parseInt(amountStr);

      if (!assetKey || !amountStr || isNaN(amount) || amount < 1) {
        return message.reply(
          '❌ Usage: `//invest buy <asset> <amount>`\n' +
            'Assets: `index`, `metals`, `realestate`, `tech`'
        );
      }

      const assets = getAssetPrices();
      const asset = assets[assetKey.toLowerCase()];

      if (!asset) {
        return message.reply(
          '❌ Invalid asset! Choose: `index`, `metals`, `realestate`, `tech`'
        );
      }

      const totalCost = asset.price * amount;
      const userData = db.get('users', message.author.id) || { wallet: 0 };

      if (userData.wallet < totalCost) {
        return message.reply(
          `❌ You need **${branding.formatNumber(totalCost)}** coins but only have **${branding.formatNumber(userData.wallet)}**!`
        );
      }

      // Deduct cost
      userData.wallet -= totalCost;
      db.set('users', message.author.id, userData);

      // Add to portfolio
      const portfolio = db.get('portfolio', message.author.id) || {};
      portfolio[assetKey] = portfolio[assetKey] || {
        units: 0,
        avgBuyPrice: 0,
      };

      const totalUnits = portfolio[assetKey].units + amount;
      const totalValue =
        portfolio[assetKey].avgBuyPrice * portfolio[assetKey].units +
        asset.price * amount;

      portfolio[assetKey].units = totalUnits;
      portfolio[assetKey].avgBuyPrice = totalValue / totalUnits;

      db.set('portfolio', message.author.id, portfolio);

      return message.reply(
        `✅ Purchased **${amount}x ${asset.name}** for **${branding.formatNumber(totalCost)}** coins!`
      );
    }

    if (action === 'sell') {
      const [, assetKey, amountStr] = args;
      const amount = parseInt(amountStr);

      if (!assetKey || !amountStr || isNaN(amount) || amount < 1) {
        return message.reply('❌ Usage: `//invest sell <asset> <amount>`');
      }

      const portfolio = db.get('portfolio', message.author.id) || {};

      if (!portfolio[assetKey] || portfolio[assetKey].units < amount) {
        return message.reply("❌ You don't have enough of that asset!");
      }

      const assets = getAssetPrices();
      const asset = assets[assetKey];

      const saleValue = asset.price * amount;

      // Add to wallet
      const userData = db.get('users', message.author.id) || { wallet: 0 };
      userData.wallet += saleValue;
      db.set('users', message.author.id, userData);

      // Update portfolio
      portfolio[assetKey].units -= amount;

      if (portfolio[assetKey].units === 0) {
        delete portfolio[assetKey];
      }

      db.set('portfolio', message.author.id, portfolio);

      return message.reply(
        `✅ Sold **${amount}x ${asset.name}** for **${branding.formatNumber(saleValue)}** coins!`
      );
    }

    if (action === 'portfolio') {
      const portfolio = db.get('portfolio', message.author.id) || {};
      const assets = getAssetPrices();

      if (Object.keys(portfolio).length === 0) {
        return message.reply('📭 Your portfolio is empty!');
      }

      let totalValue = 0;
      let totalCost = 0;

      const holdings = Object.entries(portfolio)
        .map(([key, holding]) => {
          const asset = assets[key];
          const currentValue = asset.price * holding.units;
          const cost = holding.avgBuyPrice * holding.units;
          const profit = currentValue - cost;
          const profitPercent = ((profit / cost) * 100).toFixed(2);

          totalValue += currentValue;
          totalCost += cost;

          return (
            `**${asset.emoji} ${asset.name}**\n` +
            `Units: ${holding.units}\n` +
            `Avg Buy: ${branding.formatNumber(Math.round(holding.avgBuyPrice))}\n` +
            `Current: ${branding.formatNumber(asset.price)}\n` +
            `Value: ${branding.formatNumber(Math.round(currentValue))}\n` +
            `P/L: ${profit >= 0 ? '+' : ''}${branding.formatNumber(Math.round(profit))} (${profitPercent}%)`
          );
        })
        .join('\n\n');

      const totalProfit = totalValue - totalCost;
      const totalProfitPercent = ((totalProfit / totalCost) * 100).toFixed(2);

      const embed = new EmbedBuilder()
        .setColor(
          totalProfit >= 0 ? branding.colors.success : branding.colors.error
        )
        .setTitle(`📊 ${message.author.username}'s Portfolio`)
        .setDescription(holdings)
        .addFields({
          name: '💼 Portfolio Summary',
          value:
            `**Total Value:** ${branding.formatNumber(Math.round(totalValue))} coins\n` +
            `**Total Cost:** ${branding.formatNumber(Math.round(totalCost))} coins\n` +
            `**Total P/L:** ${totalProfit >= 0 ? '+' : ''}${branding.formatNumber(Math.round(totalProfit))} (${totalProfitPercent}%)`,
          inline: false,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};

function getAssetPrices() {
  // Simulate market fluctuations
  const baseTime = Math.floor(Date.now() / (60 * 60 * 1000)); // Changes every hour

  return {
    index: {
      name: 'Index Fund',
      emoji: '📊',
      price: 100 + Math.sin(baseTime * 0.1) * 5,
      risk: 'Low',
      avgReturn: 7,
      trend: Math.sin(baseTime * 0.1) * 5,
    },
    metals: {
      name: 'Precious Metals',
      emoji: '💎',
      price: 500 + Math.sin(baseTime * 0.3) * 50,
      risk: 'Medium',
      avgReturn: 12,
      trend: Math.sin(baseTime * 0.3) * 10,
    },
    realestate: {
      name: 'Real Estate',
      emoji: '🏢',
      price: 2000 + Math.sin(baseTime * 0.2) * 100,
      risk: 'Medium',
      avgReturn: 15,
      trend: Math.sin(baseTime * 0.2) * 5,
    },
    tech: {
      name: 'Tech Stocks',
      emoji: '🚀',
      price: 1000 + Math.sin(baseTime * 0.5) * 200,
      risk: 'High',
      avgReturn: 25,
      trend: Math.sin(baseTime * 0.5) * 20,
    },
  };
}
