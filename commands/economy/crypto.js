const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'crypto',
  aliases: ['cryptocurrency', 'bitcoin'],
  description: 'Trade cryptocurrency simulation',
  usage: '<market/buy/sell/wallet>',
  category: 'economy',
  cooldown: 10,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['market', 'buy', 'sell', 'wallet'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('₿ Cryptocurrency Trading')
        .setDescription(
          '**Trade volatile crypto markets!**\n\n' +
            '**Commands:**\n' +
            '`//crypto market` - View crypto prices\n' +
            '`//crypto buy <coin> <amount>` - Buy crypto\n' +
            '`//crypto sell <coin> <amount>` - Sell crypto\n' +
            '`//crypto wallet` - View your holdings\n\n' +
            '**Coins:**\n' +
            '₿ Bitcoin (BTC) - The original\n' +
            'Ξ Ethereum (ETH) - Smart contracts\n' +
            '🐕 Dogecoin (DOGE) - To the moon!\n' +
            '💎 Litecoin (LTC) - Digital silver'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'market') {
      const prices = getCryptoPrices();

      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('₿ Crypto Market')
        .setDescription(
          Object.entries(prices)
            .map(
              ([key, crypto]) =>
                `**${crypto.symbol} ${crypto.name}**\n` +
                `💰 ${branding.formatNumber(crypto.price)} coins\n` +
                `${crypto.change24h >= 0 ? '📈' : '📉'} ${crypto.change24h >= 0 ? '+' : ''}${crypto.change24h.toFixed(2)}% (24h)`
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const [, coin, amountStr] = args;
      const amount = parseFloat(amountStr);

      if (!coin || !amountStr || isNaN(amount) || amount <= 0) {
        return message.reply(
          '❌ Usage: `//crypto buy <coin> <amount>`\n' +
            'Coins: `btc`, `eth`, `doge`, `ltc`'
        );
      }

      const prices = getCryptoPrices();
      const crypto = prices[coin.toLowerCase()];

      if (!crypto) {
        return message.reply(
          '❌ Invalid coin! Choose: `btc`, `eth`, `doge`, `ltc`'
        );
      }

      const cost = Math.ceil(crypto.price * amount);
      const userData = db.get('users', message.author.id) || { wallet: 0 };

      if (userData.wallet < cost) {
        return message.reply(
          `❌ You need **${branding.formatNumber(cost)}** coins!`
        );
      }

      userData.wallet -= cost;
      db.set('users', message.author.id, userData);

      const wallet = db.get('crypto_wallet', message.author.id) || {};
      wallet[coin.toLowerCase()] = (wallet[coin.toLowerCase()] || 0) + amount;
      db.set('crypto_wallet', message.author.id, wallet);

      return message.reply(
        `✅ Bought **${amount} ${crypto.symbol}** for **${branding.formatNumber(cost)}** coins!`
      );
    }

    if (action === 'sell') {
      const [, coin, amountStr] = args;
      const amount = parseFloat(amountStr);

      if (!coin || !amountStr || isNaN(amount) || amount <= 0) {
        return message.reply('❌ Usage: `//crypto sell <coin> <amount>`');
      }

      const wallet = db.get('crypto_wallet', message.author.id) || {};
      const holding = wallet[coin.toLowerCase()] || 0;

      if (holding < amount) {
        return message.reply("❌ You don't have enough of that coin!");
      }

      const prices = getCryptoPrices();
      const crypto = prices[coin.toLowerCase()];

      const value = Math.floor(crypto.price * amount);

      const userData = db.get('users', message.author.id) || { wallet: 0 };
      userData.wallet += value;
      db.set('users', message.author.id, userData);

      wallet[coin.toLowerCase()] -= amount;
      db.set('crypto_wallet', message.author.id, wallet);

      return message.reply(
        `✅ Sold **${amount} ${crypto.symbol}** for **${branding.formatNumber(value)}** coins!`
      );
    }

    if (action === 'wallet') {
      const wallet = db.get('crypto_wallet', message.author.id) || {};
      const prices = getCryptoPrices();

      const holdings = Object.entries(wallet)
        .filter(([, amount]) => amount > 0)
        .map(([coin, amount]) => {
          const crypto = prices[coin];
          const value = Math.floor(crypto.price * amount);
          return {
            coin,
            crypto,
            amount,
            value,
          };
        });

      if (holdings.length === 0) {
        return message.reply('📭 Your crypto wallet is empty!');
      }

      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle(`₿ ${message.author.username}'s Crypto Wallet`)
        .setDescription(
          holdings
            .map(
              h =>
                `**${h.crypto.symbol} ${h.crypto.name}**\n` +
                `Amount: ${h.amount.toFixed(8)}\n` +
                `Value: ${branding.formatNumber(h.value)} coins`
            )
            .join('\n\n')
        )
        .addFields({
          name: '💼 Total Value',
          value: `**${branding.formatNumber(totalValue)}** coins`,
          inline: false,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};

function getCryptoPrices() {
  const time = Math.floor(Date.now() / (30 * 60 * 1000)); // Changes every 30 min

  return {
    btc: {
      name: 'Bitcoin',
      symbol: '₿',
      price: 50000 + Math.sin(time * 0.7) * 5000,
      change24h: Math.sin(time * 0.7) * 10,
    },
    eth: {
      name: 'Ethereum',
      symbol: 'Ξ',
      price: 3000 + Math.sin(time * 0.9) * 300,
      change24h: Math.sin(time * 0.9) * 12,
    },
    doge: {
      name: 'Dogecoin',
      symbol: '🐕',
      price: 0.25 + Math.sin(time * 1.5) * 0.1,
      change24h: Math.sin(time * 1.5) * 25,
    },
    ltc: {
      name: 'Litecoin',
      symbol: '💎',
      price: 150 + Math.sin(time * 1.1) * 20,
      change24h: Math.sin(time * 1.1) * 8,
    },
  };
}
