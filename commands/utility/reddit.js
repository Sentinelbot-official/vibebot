const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'reddit',
  description: 'Get posts from a subreddit',
  usage: '<subreddit> [hot/new/top]',
  aliases: ['subreddit'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a subreddit!\nUsage: `reddit <subreddit> [hot/new/top]`\nExample: `reddit memes hot`'
      );
    }

    const subreddit = args[0].toLowerCase().replace(/^r\//, '');
    const sort = args[1]?.toLowerCase() || 'hot';
    const validSorts = ['hot', 'new', 'top', 'rising'];

    if (!validSorts.includes(sort)) {
      return message.reply(
        `❌ Invalid sort! Valid options: ${validSorts.join(', ')}`
      );
    }

    const fetchingMsg = await message.reply('📱 Fetching from Reddit...');

    try {
      const response = await axios.get(
        `https://www.reddit.com/r/${subreddit}/${sort}.json`,
        {
          params: {
            limit: 10,
            t: sort === 'top' ? 'day' : undefined,
          },
          headers: {
            'User-Agent': 'DiscordBot/1.0',
          },
        }
      );

      const posts = response.data.data.children;

      if (!posts || !posts.length) {
        return fetchingMsg.edit(`❌ No posts found in r/${subreddit}!`);
      }

      // Filter out NSFW if not in NSFW channel
      let filteredPosts = posts.filter(p => !p.data.over_18 || message.channel.nsfw);

      if (!filteredPosts.length) {
        return fetchingMsg.edit(
          `❌ Only NSFW posts found! Use this command in an NSFW channel.`
        );
      }

      const post = filteredPosts[0].data;

      const embed = new EmbedBuilder()
        .setColor(0xff4500)
        .setAuthor({
          name: `r/${subreddit}`,
          url: `https://reddit.com/r/${subreddit}`,
        })
        .setTitle(post.title.substring(0, 256))
        .setURL(`https://reddit.com${post.permalink}`)
        .addFields(
          {
            name: '👤 Author',
            value: `u/${post.author}`,
            inline: true,
          },
          {
            name: '⬆️ Upvotes',
            value: post.ups.toLocaleString(),
            inline: true,
          },
          {
            name: '💬 Comments',
            value: post.num_comments.toLocaleString(),
            inline: true,
          }
        );

      if (post.selftext && !post.is_video && !post.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        embed.setDescription(post.selftext.substring(0, 2000));
      }

      if (post.url && post.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        embed.setImage(post.url);
      }

      if (post.thumbnail && post.thumbnail.startsWith('http') && !post.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
        embed.setThumbnail(post.thumbnail);
      }

      embed.setFooter({ text: `${sort} posts` });
      embed.setTimestamp(new Date(post.created_utc * 1000));

      // Add other results
      if (filteredPosts.length > 1) {
        const otherResults = filteredPosts
          .slice(1, 5)
          .map(
            (p, i) =>
              `**${i + 2}.** [${p.data.title.substring(0, 50)}...](https://reddit.com${p.data.permalink}) (⬆️ ${p.data.ups})`
          )
          .join('\n');

        embed.addFields({
          name: '📋 More Posts',
          value: otherResults,
          inline: false,
        });
      }

      return fetchingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Reddit API Error:', error.response?.data || error.message);

      let errorMsg = 'Failed to fetch from Reddit. ';
      if (error.response?.status === 404) {
        errorMsg += `Subreddit r/${subreddit} not found!`;
      } else if (error.response?.status === 403) {
        errorMsg += 'Subreddit is private or banned.';
      } else {
        errorMsg += error.message;
      }

      return fetchingMsg.edit(`❌ ${errorMsg}`);
    }
  },
};
