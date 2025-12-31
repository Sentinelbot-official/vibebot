const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');

// Stock market data
const STOCKS = {
  TECH: { name: '💻 TechCorp', volatility: 0.15, basePrice: 1000 },
  FOOD: { name: '🍔 FoodChain', volatility: 0.08, basePrice: 500 },
  GAME: { name: '🎮 GameStudio', volatility: 0.20, basePrice: 1500 },
  MUSIC: { name: '🎵 MusicStream', volatility: 0.12, basePrice: 800 },
  SPACE: { name: '🚀 SpaceX', volatility: 0.25, basePrice: 2000 },
  CRYPTO: { name: '₿ CryptoExchange', volatility: 0.30, basePrice: 3000 },
};

module.exports = {
  name: 'stocks',
  description: 'Invest in the stock market (VIP only)',
  usage: '//stocks <buy/sell/portfolio/market> [symbol] [amount]',
  aliases: ['stock', 'invest'],
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
          'The stock market is a **VIP-exclusive** feature!\n\n' +
            '**VIP Benefits:**\n' +
            '• Access to stock market\n' +
            '• Business ownership\n' +
            '• AI chatbot\n' +
            '• Custom commands\n' +
            '• All Premium features\n\n' +
            'Use `//premium` to upgrade!'
        )
        .setFooter({ text: 'Support the 24/7 live coding journey! 💜' });

      return message.reply({ embeds: [embed] });
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['buy', 'sell', 'portfolio', 'market'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📈 Stock Market')
        .setDescription(
          '**Invest in virtual stocks and grow your wealth!**\n\n' +
            '**Commands:**\n' +
            '`//stocks market` - View available stocks\n' +
            '`//stocks buy <symbol> <shares>` - Buy stocks\n' +
            '`//stocks sell <symbol> <shares>` - Sell stocks\n' +
            '`//stocks portfolio` - View your portfolio\n\n' +
            '**Available Stocks:**\n' +
            Object.entries(STOCKS)
              .map(([symbol, data]) => `• **${symbol}** - ${data.name}`)
              .join('\n')
        )
        .setFooter({ text: '👑 VIP Feature | Prices update every 5 minutes' });

      return message.reply({ embeds: [embed] });
    }

    // Get current stock prices
    const stockPrices = getStockPrices();

    if (action === 'market') {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 Stock Market')
        .setDescription('**Current Stock Prices**\n\nPrices update every 5 minutes')
        .setTimestamp();

      for (const [symbol, stock] of Object.entries(STOCKS)) {
        const price = stockPrices[symbol];
        const change = getStockChange(symbol);
        const changeEmoji = change >= 0 ? '📈' : '📉';
        const changeText = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;

        embed.addFields({
          name: `${stock.name} (${symbol})`,
          value: `**${price.toLocaleString()} coins** ${changeEmoji} ${changeText}`,
          inline: true,
        });
      }

      embed.setFooter({ text: '👑 VIP Feature | Use //stocks buy <symbol> <shares>' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const symbol = args[1]?.toUpperCase();
      const shares = parseInt(args[2]);

      if (!symbol || !STOCKS[symbol]) {
        return message.reply(
          `❌ Invalid stock symbol! Available: ${Object.keys(STOCKS).join(', ')}`
        );
      }

      if (!shares || shares < 1) {
        return message.reply('❌ Please specify a valid number of shares!');
      }

      const price = stockPrices[symbol];
      const totalCost = price * shares;

      // Get user economy
      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      if (economy.coins < totalCost) {
        return message.reply(
          `❌ You don't have enough coins! You need ${totalCost.toLocaleString()} coins in your wallet.`
        );
      }

      // Deduct coins
      economy.coins -= totalCost;
      db.set('economy', message.author.id, economy);

      // Add to portfolio
      const portfolio = db.get('stock_portfolio', message.author.id) || {};
      if (!portfolio[symbol]) {
        portfolio[symbol] = { shares: 0, avgPrice: 0 };
      }

      const totalShares = portfolio[symbol].shares + shares;
      const totalValue =
        portfolio[symbol].shares * portfolio[symbol].avgPrice + totalCost;
      portfolio[symbol].avgPrice = totalValue / totalShares;
      portfolio[symbol].shares = totalShares;

      db.set('stock_portfolio', message.author.id, portfolio);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Stock Purchase Successful!')
        .setDescription(
          `**Stock:** ${STOCKS[symbol].name} (${symbol})\n` +
            `**Shares:** ${shares}\n` +
            `**Price per Share:** ${price.toLocaleString()} coins\n` +
            `**Total Cost:** ${totalCost.toLocaleString()} coins\n\n` +
            `**New Balance:** ${economy.coins.toLocaleString()} coins`
        )
        .setFooter({ text: '👑 VIP Feature | Prices fluctuate!' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'sell') {
      const symbol = args[1]?.toUpperCase();
      const shares = parseInt(args[2]);

      if (!symbol || !STOCKS[symbol]) {
        return message.reply(
          `❌ Invalid stock symbol! Available: ${Object.keys(STOCKS).join(', ')}`
        );
      }

      if (!shares || shares < 1) {
        return message.reply('❌ Please specify a valid number of shares!');
      }

      // Get portfolio
      const portfolio = db.get('stock_portfolio', message.author.id) || {};

      if (!portfolio[symbol] || portfolio[symbol].shares < shares) {
        return message.reply(
          `❌ You don't have enough shares! You own ${portfolio[symbol]?.shares || 0} shares of ${symbol}.`
        );
      }

      const price = stockPrices[symbol];
      const totalValue = price * shares;
      const avgPrice = portfolio[symbol].avgPrice;
      const profit = (price - avgPrice) * shares;
      const profitPercent = ((price - avgPrice) / avgPrice) * 100;

      // Add coins
      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };
      economy.coins += totalValue;
      db.set('economy', message.author.id, economy);

      // Update portfolio
      portfolio[symbol].shares -= shares;
      if (portfolio[symbol].shares === 0) {
        delete portfolio[symbol];
      }
      db.set('stock_portfolio', message.author.id, portfolio);

      const embed = new EmbedBuilder()
        .setColor(profit >= 0 ? '#00ff00' : '#ff0000')
        .setTitle('✅ Stock Sale Successful!')
        .setDescription(
          `**Stock:** ${STOCKS[symbol].name} (${symbol})\n` +
            `**Shares Sold:** ${shares}\n` +
            `**Price per Share:** ${price.toLocaleString()} coins\n` +
            `**Total Value:** ${totalValue.toLocaleString()} coins\n\n` +
            `**Profit/Loss:** ${profit >= 0 ? '+' : ''}${profit.toLocaleString()} coins (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)\n\n` +
            `**New Balance:** ${economy.coins.toLocaleString()} coins`
        )
        .setFooter({ text: '👑 VIP Feature | Well done!' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'portfolio') {
      const portfolio = db.get('stock_portfolio', message.author.id) || {};

      if (Object.keys(portfolio).length === 0) {
        return message.reply('📭 You don\'t own any stocks yet!');
      }

      let totalValue = 0;
      let totalInvested = 0;

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 Your Stock Portfolio')
        .setDescription('**Your Investments**')
        .setTimestamp();

      for (const [symbol, data] of Object.entries(portfolio)) {
        const currentPrice = stockPrices[symbol];
        const currentValue = currentPrice * data.shares;
        const invested = data.avgPrice * data.shares;
        const profit = currentValue - invested;
        const profitPercent = (profit / invested) * 100;

        totalValue += currentValue;
        totalInvested += invested;

        embed.addFields({
          name: `${STOCKS[symbol].name} (${symbol})`,
          value:
            `**Shares:** ${data.shares}\n` +
            `**Avg Price:** ${data.avgPrice.toLocaleString()} coins\n` +
            `**Current Price:** ${currentPrice.toLocaleString()} coins\n` +
            `**Value:** ${currentValue.toLocaleString()} coins\n` +
            `**P/L:** ${profit >= 0 ? '+' : ''}${profit.toLocaleString()} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)`,
          inline: true,
        });
      }

      const totalProfit = totalValue - totalInvested;
      const totalProfitPercent = (totalProfit / totalInvested) * 100;

      embed.addFields({
        name: '💰 Portfolio Summary',
        value:
          `**Total Invested:** ${totalInvested.toLocaleString()} coins\n` +
          `**Current Value:** ${totalValue.toLocaleString()} coins\n` +
          `**Total P/L:** ${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()} coins (${totalProfitPercent >= 0 ? '+' : ''}${totalProfitPercent.toFixed(2)}%)`,
        inline: false,
      });

      embed.setFooter({ text: '👑 VIP Feature | Prices update every 5 minutes' });

      return message.reply({ embeds: [embed] });
    }
  },
};

// Get current stock prices with fluctuation
function getStockPrices() {
  const now = Date.now();
  const interval = 5 * 60 * 1000; // 5 minutes
  const seed = Math.floor(now / interval);

  const prices = {};
  for (const [symbol, stock] of Object.entries(STOCKS)) {
    // Use seed for consistent prices within interval
    const random = seededRandom(seed + symbol.charCodeAt(0));
    const change = (random - 0.5) * 2 * stock.volatility;
    prices[symbol] = Math.floor(stock.basePrice * (1 + change));
  }

  return prices;
}

// Get stock price change percentage
function getStockChange(symbol) {
  const now = Date.now();
  const interval = 5 * 60 * 1000;
  const currentSeed = Math.floor(now / interval);
  const previousSeed = currentSeed - 1;

  const stock = STOCKS[symbol];

  const currentRandom = seededRandom(currentSeed + symbol.charCodeAt(0));
  const previousRandom = seededRandom(previousSeed + symbol.charCodeAt(0));

  const currentPrice = stock.basePrice * (1 + (currentRandom - 0.5) * 2 * stock.volatility);
  const previousPrice = stock.basePrice * (1 + (previousRandom - 0.5) * 2 * stock.volatility);

  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

// Seeded random number generator
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
