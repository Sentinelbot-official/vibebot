const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  name: 'crypto',
  description: 'Get cryptocurrency prices and information',
  usage: '<symbol> [currency]',
  aliases: ['coin', 'bitcoin', 'btc', 'eth'],
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a cryptocurrency symbol! Usage: `crypto <symbol> [currency]`\nExample: `crypto BTC` or `crypto ETH USD`'
      );
    }

    const symbol = args[0].toUpperCase();
    const currency = args[1] ? args[1].toUpperCase() : 'USD';

    try {
      // Using CoinGecko API (free, no API key required)
      const cryptoData = await fetchCryptoPrice(symbol, currency);

      const priceChange = cryptoData.priceChange24h;
      const changeEmoji = priceChange >= 0 ? '📈' : '📉';
      const changeColor = priceChange >= 0 ? 0x00ff00 : 0xff0000;

      const embed = new EmbedBuilder()
        .setColor(changeColor)
        .setTitle(`${changeEmoji} ${cryptoData.name} (${cryptoData.symbol})`)
        .setThumbnail(cryptoData.image)
        .addFields(
          {
            name: `💰 Price (${currency})`,
            value: `${cryptoData.currencySymbol}${cryptoData.price.toLocaleString()}`,
            inline: true,
          },
          {
            name: '📊 24h Change',
            value: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
            inline: true,
          },
          {
            name: '📈 24h High',
            value: `${cryptoData.currencySymbol}${cryptoData.high24h.toLocaleString()}`,
            inline: true,
          },
          {
            name: '📉 24h Low',
            value: `${cryptoData.currencySymbol}${cryptoData.low24h.toLocaleString()}`,
            inline: true,
          },
          {
            name: '💎 Market Cap',
            value: `${cryptoData.currencySymbol}${cryptoData.marketCap.toLocaleString()}`,
            inline: true,
          },
          {
            name: '📊 24h Volume',
            value: `${cryptoData.currencySymbol}${cryptoData.volume24h.toLocaleString()}`,
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      if (cryptoData.ath) {
        embed.addFields({
          name: '🏆 All-Time High',
          value: `${cryptoData.currencySymbol}${cryptoData.ath.toLocaleString()} (${cryptoData.athDate})`,
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Crypto command error:', error);
      return message.reply(
        '❌ Could not fetch cryptocurrency data. Please check the symbol and try again.\n💡 Try: BTC, ETH, BNB, SOL, ADA, DOGE, XRP, DOT, MATIC, LINK'
      );
    }
  },
};

function fetchCryptoPrice(symbol, currency) {
  return new Promise((resolve, reject) => {
    // Map common symbols to CoinGecko IDs
    const symbolMap = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      BNB: 'binancecoin',
      SOL: 'solana',
      ADA: 'cardano',
      DOGE: 'dogecoin',
      XRP: 'ripple',
      DOT: 'polkadot',
      MATIC: 'matic-network',
      LINK: 'chainlink',
      UNI: 'uniswap',
      LTC: 'litecoin',
      AVAX: 'avalanche-2',
      ATOM: 'cosmos',
      SHIB: 'shiba-inu',
    };

    const coinId = symbolMap[symbol] || symbol.toLowerCase();
    const curr = currency.toLowerCase();

    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;

    https
      .get(url, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (json.error) {
              return reject(new Error(json.error));
            }

            const currencySymbols = {
              USD: '$',
              EUR: '€',
              GBP: '£',
              JPY: '¥',
              BTC: '₿',
              ETH: 'Ξ',
            };

            const cryptoData = {
              name: json.name,
              symbol: json.symbol.toUpperCase(),
              image: json.image?.large || json.image?.small,
              price: json.market_data.current_price[curr] || 0,
              priceChange24h: json.market_data.price_change_percentage_24h || 0,
              high24h: json.market_data.high_24h[curr] || 0,
              low24h: json.market_data.low_24h[curr] || 0,
              marketCap: json.market_data.market_cap[curr] || 0,
              volume24h: json.market_data.total_volume[curr] || 0,
              ath: json.market_data.ath?.[curr],
              athDate: json.market_data.ath_date?.[curr]
                ? new Date(json.market_data.ath_date[curr]).toLocaleDateString()
                : null,
              currencySymbol: currencySymbols[currency] || currency + ' ',
            };

            resolve(cryptoData);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}
