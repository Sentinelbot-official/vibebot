const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  name: 'shorten',
  description: 'Shorten a URL using TinyURL',
  usage: '<url>',
  aliases: ['short', 'tinyurl'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a URL to shorten! Usage: `shorten <url>`\nExample: `shorten https://example.com/very/long/url`'
      );
    }

    const url = args[0];

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return message.reply(
        '❌ Please provide a valid URL starting with http:// or https://'
      );
    }

    try {
      const shortUrl = await shortenURL(url);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle('🔗 URL Shortened')
        .addFields(
          {
            name: '📎 Original URL',
            value: url.length > 1024 ? url.substring(0, 1021) + '...' : url,
            inline: false,
          },
          { name: '✂️ Shortened URL', value: shortUrl, inline: false }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Shorten command error:', error);
      return message.reply(
        '❌ Could not shorten the URL. Please check the URL and try again.'
      );
    }
  },
};

function shortenURL(url) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;

    https
      .get(apiUrl, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          if (data.startsWith('http')) {
            resolve(data.trim());
          } else {
            reject(new Error('Invalid response from TinyURL'));
          }
        });
      })
      .on('error', reject);
  });
}
