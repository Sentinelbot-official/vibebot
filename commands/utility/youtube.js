const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'youtube',
  description: 'Search for YouTube videos',
  usage: '<search query>',
  aliases: ['yt', 'ytsearch'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a search query!\nUsage: `youtube <query>`\nExample: `youtube funny cats`'
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ YouTube API not configured!\n\n' +
          '**Setup:**\n' +
          '1. Get free API key from [Google Cloud Console](https://console.cloud.google.com)\n' +
          '2. Enable YouTube Data API v3\n' +
          '3. Add `YOUTUBE_API_KEY=your_key` to .env file'
      );
    }

    const query = args.join(' ');
    const searchingMsg = await message.reply('🔍 Searching YouTube...');

    try {
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            key: apiKey,
            q: query,
            part: 'snippet',
            type: 'video',
            maxResults: 5,
          },
        }
      );

      if (!response.data.items || !response.data.items.length) {
        return searchingMsg.edit(`❌ No videos found for "${query}"!`);
      }

      const videos = response.data.items;

      // Get video statistics
      const videoIds = videos.map(v => v.id.videoId).join(',');
      const statsResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            key: apiKey,
            id: videoIds,
            part: 'statistics,contentDetails',
          },
        }
      );

      const video = videos[0];
      const stats = statsResponse.data.items[0];

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(video.snippet.title)
        .setURL(`https://www.youtube.com/watch?v=${video.id.videoId}`)
        .setDescription(
          video.snippet.description.substring(0, 200) + '...' ||
            'No description'
        )
        .setThumbnail(video.snippet.thumbnails.high.url)
        .addFields(
          {
            name: '📺 Channel',
            value: video.snippet.channelTitle,
            inline: true,
          },
          {
            name: '👁️ Views',
            value: parseInt(stats.statistics.viewCount).toLocaleString(),
            inline: true,
          },
          {
            name: '👍 Likes',
            value: parseInt(stats.statistics.likeCount || 0).toLocaleString(),
            inline: true,
          }
        )
        .setFooter({ text: 'YouTube' })
        .setTimestamp(new Date(video.snippet.publishedAt));

      // Add other results
      if (videos.length > 1) {
        const otherResults = videos
          .slice(1, 5)
          .map(
            (v, i) =>
              `**${i + 2}.** [${v.snippet.title.substring(0, 50)}...](https://www.youtube.com/watch?v=${v.id.videoId})`
          )
          .join('\n');

        embed.addFields({
          name: '🔍 Other Results',
          value: otherResults,
          inline: false,
        });
      }

      return searchingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error(
        'YouTube API Error:',
        error.response?.data || error.message
      );

      let errorMsg = 'Failed to search YouTube. ';
      if (error.response?.status === 403) {
        errorMsg += 'API key invalid or quota exceeded.';
      } else {
        errorMsg += error.message;
      }

      return searchingMsg.edit(`❌ ${errorMsg}`);
    }
  },
};
