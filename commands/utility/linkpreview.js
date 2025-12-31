const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'linkpreview',
  description: 'Preview a link safely',
  usage: '<url>',
  aliases: ['preview', 'linkinfo'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a URL!\nUsage: `linkpreview <url>`\nExample: `linkpreview https://example.com`'
      );
    }

    const url = args[0];

    try {
      new URL(url);
    } catch (error) {
      return message.reply('❌ Invalid URL!');
    }

    const fetchingMsg = await message.reply('🔍 Fetching link preview...');

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)',
        },
      });

      const html = response.data;

      // Extract meta tags
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const descMatch = html.match(
        /<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["'](.*?)["']/i
      );
      const imageMatch = html.match(
        /<meta\s+(?:name|property)=["'](?:og:image|twitter:image)["']\s+content=["'](.*?)["']/i
      );

      const title = titleMatch ? titleMatch[1] : 'No title';
      const description = descMatch ? descMatch[1] : 'No description available';
      const image = imageMatch ? imageMatch[1] : null;

      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle(title.substring(0, 256))
        .setURL(url)
        .setDescription(description.substring(0, 2048))
        .addFields(
          { name: '🔗 URL', value: url, inline: false },
          {
            name: '📊 Status',
            value: `${response.status} ${response.statusText}`,
            inline: true,
          },
          {
            name: '📏 Size',
            value: `${(html.length / 1024).toFixed(2)} KB`,
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      if (image && image.startsWith('http')) {
        embed.setImage(image);
      }

      return fetchingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      let errorMsg = 'Failed to fetch link preview. ';

      if (error.code === 'ECONNABORTED') {
        errorMsg += 'Request timed out.';
      } else if (error.response) {
        errorMsg += `Status: ${error.response.status}`;
      } else {
        errorMsg += error.message;
      }

      return fetchingMsg.edit(`❌ ${errorMsg}`);
    }
  },
};
