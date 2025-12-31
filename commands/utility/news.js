const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'news',
  description: 'Get latest news headlines',
  usage: '[category/country]',
  aliases: ['headlines'],
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ News API not configured!\n\n' +
          '**Setup:**\n' +
          '1. Get free API key from [NewsAPI](https://newsapi.org)\n' +
          '2. Add `NEWS_API_KEY=your_key` to .env file'
      );
    }

    const category = args[0]?.toLowerCase();
    const validCategories = [
      'business',
      'entertainment',
      'general',
      'health',
      'science',
      'sports',
      'technology',
    ];

    if (category && !validCategories.includes(category)) {
      return message.reply(
        `❌ Invalid category!\nValid categories: ${validCategories.join(', ')}\n\nUsage: \`news [category]\`\nExample: \`news technology\``
      );
    }

    const fetchingMsg = await message.reply('📰 Fetching news...');

    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          apiKey: apiKey,
          country: 'us',
          category: category || 'general',
          pageSize: 5,
        },
      });

      const articles = response.data.articles;

      if (!articles || !articles.length) {
        return fetchingMsg.edit('❌ No news articles found!');
      }

      const embeds = articles.slice(0, 5).map((article, index) => {
        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle(article.title)
          .setURL(article.url)
          .setDescription(
            article.description?.substring(0, 200) || 'No description'
          );

        if (article.urlToImage) {
          embed.setImage(article.urlToImage);
        }

        if (article.source?.name) {
          embed.setAuthor({ name: article.source.name });
        }

        if (article.publishedAt) {
          embed.setTimestamp(new Date(article.publishedAt));
        }

        embed.setFooter({
          text: `Article ${index + 1}/${articles.length} | ${category || 'general'}`,
        });

        return embed;
      });

      await fetchingMsg.edit({
        content: `📰 **Top ${category || 'General'} News Headlines**`,
        embeds: [embeds[0]],
      });

      // Send remaining articles
      for (let i = 1; i < embeds.length; i++) {
        await message.channel.send({ embeds: [embeds[i]] });
      }
    } catch (error) {
      console.error('News API Error:', error.response?.data || error.message);

      let errorMsg = 'Failed to fetch news. ';
      if (error.response?.status === 401) {
        errorMsg += 'Invalid API key.';
      } else if (error.response?.status === 429) {
        errorMsg += 'Rate limit exceeded.';
      } else {
        errorMsg += error.message;
      }

      return fetchingMsg.edit(`❌ ${errorMsg}`);
    }
  },
};
