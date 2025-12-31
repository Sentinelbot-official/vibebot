const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

const stocks = {
  TECH: { name: 'TechCorp', basePrice: 100, volatility: 0.1 },
  GAME: { name: 'GameStudio', basePrice: 50, volatility: 0.15 },
  FOOD: { name: 'FoodChain', basePrice: 75, volatility: 0.08 },
  AUTO: { name: 'AutoMakers', basePrice: 150, volatility: 0.12 },
};

function getStockPrice(symbol) {
  const stock = stocks[symbol];
  const randomChange = (Math.random() - 0.5) * 2 * stock.volatility;
  return Math.floor(stock.basePrice * (1 + randomChange));
}

module.exports = {
  name: 'stocks',
  description: 'Buy and sell stocks',
  usage: '[buy/sell/portfolio/market] [symbol] [amount]',
  aliases: ['stock', 'invest'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'market') {
      const stockList = Object.entries(stocks)
        .map(([symbol, stock]) => {
          const price = getStockPrice(symbol);
          return `**${symbol}** (${stock.name}) - ${price} coins`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📈 Stock Market')
        .setDescription(stockList)
        .setFooter({ text: 'Use "stocks buy <symbol> <amount>" to invest' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'portfolio') {
      const portfolio = db.get('stocks', message.author.id) || {};

      if (Object.keys(portfolio).length === 0) {
        return message.reply("❌ You don't own any stocks!");
      }

      let totalValue = 0;
      const holdings = Object.entries(portfolio)
        .map(([symbol, amount]) => {
          const currentPrice = getStockPrice(symbol);
          const value = currentPrice * amount;
          totalValue += value;
          return `**${symbol}** - ${amount} shares (${value.toLocaleString()} coins)`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('💼 Your Portfolio')
        .setDescription(holdings)
        .addFields({
          name: '💰 Total Value',
          value: `${totalValue.toLocaleString()} coins`,
          inline: true,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const symbol = args[1]?.toUpperCase();
      const amount = parseInt(args[2]);

      if (!symbol || !stocks[symbol]) {
        return message.reply(
          '❌ Invalid stock symbol! Use `stocks market` to see available stocks.'
        );
      }

      if (isNaN(amount) || amount < 1) {
        return message.reply('❌ Please provide a valid amount!');
      }

      const price = getStockPrice(symbol);
      const totalCost = price * amount;

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };
      if (economy.coins < totalCost) {
        return message.reply(
          `❌ You need ${totalCost.toLocaleString()} coins! You have ${economy.coins.toLocaleString()}.`
        );
      }

      economy.coins -= totalCost;
      db.set('economy', message.author.id, economy);

      const portfolio = db.get('stocks', message.author.id) || {};
      portfolio[symbol] = (portfolio[symbol] || 0) + amount;
      db.set('stocks', message.author.id, portfolio);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Stocks Purchased!')
        .setDescription(
          `Bought **${amount}** shares of **${symbol}** for **${totalCost.toLocaleString()}** coins`
        )
        .addFields({
          name: '📊 Price per Share',
          value: `${price} coins`,
          inline: true,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'sell') {
      const symbol = args[1]?.toUpperCase();
      const amount = parseInt(args[2]);

      if (!symbol || !stocks[symbol]) {
        return message.reply('❌ Invalid stock symbol!');
      }

      if (isNaN(amount) || amount < 1) {
        return message.reply('❌ Please provide a valid amount!');
      }

      const portfolio = db.get('stocks', message.author.id) || {};
      if (!portfolio[symbol] || portfolio[symbol] < amount) {
        return message.reply(
          `❌ You don't have ${amount} shares of ${symbol}!`
        );
      }

      const price = getStockPrice(symbol);
      const totalValue = price * amount;

      portfolio[symbol] -= amount;
      if (portfolio[symbol] === 0) delete portfolio[symbol];
      db.set('stocks', message.author.id, portfolio);

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };
      economy.coins += totalValue;
      db.set('economy', message.author.id, economy);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Stocks Sold!')
        .setDescription(
          `Sold **${amount}** shares of **${symbol}** for **${totalValue.toLocaleString()}** coins`
        )
        .addFields({
          name: '📊 Price per Share',
          value: `${price} coins`,
          inline: true,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply('❌ Usage: `stocks [buy/sell/portfolio/market]`');
  },
};
