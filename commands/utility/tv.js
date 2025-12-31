const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'tv',
  description: 'Search for TV show information',
  usage: '<show name>',
  aliases: ['tvshow', 'series'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a TV show name!\nUsage: `tv <name>`\nExample: `tv Breaking Bad`'
      );
    }

    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ TMDB API not configured!\n\n' +
          '**Setup:**\n' +
          '1. Get free API key from [TMDB](https://www.themoviedb.org/settings/api)\n' +
          '2. Add `TMDB_API_KEY=your_key` to .env file'
      );
    }

    const query = args.join(' ');
    const searchingMsg = await message.reply('📺 Searching...');

    try {
      // Search for TV show
      const searchResponse = await axios.get(
        'https://api.themoviedb.org/3/search/tv',
        {
          params: {
            api_key: apiKey,
            query: query,
            language: 'en-US',
          },
        }
      );

      if (!searchResponse.data.results.length) {
        return searchingMsg.edit(`❌ No TV shows found for "${query}"!`);
      }

      const show = searchResponse.data.results[0];

      // Get detailed info
      const detailsResponse = await axios.get(
        `https://api.themoviedb.org/3/tv/${show.id}`,
        {
          params: {
            api_key: apiKey,
            language: 'en-US',
            append_to_response: 'credits',
          },
        }
      );

      const details = detailsResponse.data;

      // Build embed
      const embed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle(details.name)
        .setURL(`https://www.themoviedb.org/tv/${details.id}`)
        .setDescription(details.overview || 'No description available');

      if (details.poster_path) {
        embed.setThumbnail(
          `https://image.tmdb.org/t/p/w500${details.poster_path}`
        );
      }

      if (details.backdrop_path) {
        embed.setImage(
          `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        );
      }

      const fields = [];

      if (details.first_air_date) {
        fields.push({
          name: '📅 First Aired',
          value: new Date(details.first_air_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          inline: true,
        });
      }

      if (details.status) {
        fields.push({
          name: '📊 Status',
          value: details.status,
          inline: true,
        });
      }

      if (details.vote_average) {
        fields.push({
          name: '⭐ Rating',
          value: `${details.vote_average.toFixed(1)}/10 (${details.vote_count.toLocaleString()} votes)`,
          inline: true,
        });
      }

      if (details.number_of_seasons) {
        fields.push({
          name: '📺 Seasons',
          value: details.number_of_seasons.toString(),
          inline: true,
        });
      }

      if (details.number_of_episodes) {
        fields.push({
          name: '🎬 Episodes',
          value: details.number_of_episodes.toString(),
          inline: true,
        });
      }

      if (details.episode_run_time && details.episode_run_time.length) {
        fields.push({
          name: '⏱️ Episode Runtime',
          value: `~${details.episode_run_time[0]} min`,
          inline: true,
        });
      }

      if (details.genres && details.genres.length) {
        fields.push({
          name: '🎭 Genres',
          value: details.genres.map(g => g.name).join(', '),
          inline: false,
        });
      }

      if (details.created_by && details.created_by.length) {
        fields.push({
          name: '🎥 Created By',
          value: details.created_by.map(c => c.name).join(', '),
          inline: false,
        });
      }

      if (details.credits?.cast && details.credits.cast.length) {
        const cast = details.credits.cast
          .slice(0, 5)
          .map(c => c.name)
          .join(', ');
        fields.push({
          name: '🎬 Cast',
          value: cast,
          inline: false,
        });
      }

      if (details.networks && details.networks.length) {
        fields.push({
          name: '📡 Network',
          value: details.networks.map(n => n.name).join(', '),
          inline: true,
        });
      }

      if (details.tagline) {
        fields.push({
          name: '💬 Tagline',
          value: `*"${details.tagline}"*`,
          inline: false,
        });
      }

      embed.addFields(fields);
      embed.setFooter(branding.footers.default);
      embed.setTimestamp();

      return searchingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('TMDB API Error:', error.response?.data || error.message);

      let errorMsg = 'Failed to fetch TV show data. ';
      if (error.response?.status === 401) {
        errorMsg += 'Invalid API key.';
      } else if (error.response?.status === 429) {
        errorMsg += 'Rate limit exceeded.';
      } else {
        errorMsg += error.message;
      }

      return searchingMsg.edit(`❌ ${errorMsg}`);
    }
  },
};
