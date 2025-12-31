const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'crypto',
  aliases: ['bitcoin', 'btc', 'eth', 'price'],
  description: 'Get cryptocurrency price (placeholder - requires API)',
  usage: '<symbol>',
  category: 'utility',
  cooldown: 10,
  execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a cryptocurrency symbol! (e.g., BTC, ETH, DOGE)'
      );
    }

    const symbol = args[0].toUpperCase();

    // This is a placeholder - you would integrate with a crypto API

    const embed = new EmbedBuilder()
      .setColor(0xf7931a)
      .setTitle(`💰 ${symbol} Price`)
      .setDescription(
        '⚠️ **Crypto API Not Configured**\n\n' +
          'To use this command, you need to:\n' +
          '1. Get an API key from a crypto data provider\n' +
          '2. Add API key to .env\n' +
          '3. Update this command with API integration'
      )
      .addFields({
        name: 'Recommended APIs',
        value:
          '• [CoinGecko API](https://www.coingecko.com/en/api) (Free, no key)\n• [CoinMarketCap API](https://coinmarketcap.com/api/)\n• [Binance API](https://binance-docs.github.io/apidocs/)\n• [CryptoCompare](https://www.cryptocompare.com/api/)',
        inline: false,
      });

    message.reply({ embeds: [embed] });
  },
};
