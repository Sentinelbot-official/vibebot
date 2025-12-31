const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'movie',
  description: 'Search for movie information',
  usage: '<movie name>',
  aliases: ['film', 'imdb'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a movie name!\nUsage: `movie <name>`\nExample: `movie Inception`'
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
    const searchingMsg = await message.reply('🎬 Searching...');

    try {
      // Search for movie
      const searchResponse = await axios.get(
        'https://api.themoviedb.org/3/search/movie',
        {
          params: {
            api_key: apiKey,
            query: query,
            language: 'en-US',
          },
        }
      );

      if (!searchResponse.data.results.length) {
        return searchingMsg.edit(`❌ No movies found for "${query}"!`);
      }

      const movie = searchResponse.data.results[0];

      // Get detailed info
      const detailsResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movie.id}`,
        {
          params: {
            api_key: apiKey,
            language: 'en-US',
            append_to_response: 'credits,videos',
          },
        }
      );

      const details = detailsResponse.data;

      // Build embed
      const embed = new EmbedBuilder()
        .setColor(branding.colors.premium)
        .setTitle(details.title)
        .setURL(`https://www.themoviedb.org/movie/${details.id}`)
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

      if (details.release_date) {
        fields.push({
          name: '📅 Release Date',
          value: new Date(details.release_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          inline: true,
        });
      }

      if (details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const minutes = details.runtime % 60;
        fields.push({
          name: '⏱️ Runtime',
          value: `${hours}h ${minutes}m`,
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

      if (details.genres && details.genres.length) {
        fields.push({
          name: '🎭 Genres',
          value: details.genres.map(g => g.name).join(', '),
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

      if (details.credits?.crew) {
        const director = details.credits.crew.find(c => c.job === 'Director');
        if (director) {
          fields.push({
            name: '🎥 Director',
            value: director.name,
            inline: true,
          });
        }
      }

      if (details.budget && details.budget > 0) {
        fields.push({
          name: '💰 Budget',
          value: `$${(details.budget / 1000000).toFixed(1)}M`,
          inline: true,
        });
      }

      if (details.revenue && details.revenue > 0) {
        fields.push({
          name: '💵 Revenue',
          value: `$${(details.revenue / 1000000).toFixed(1)}M`,
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

      let errorMsg = 'Failed to fetch movie data. ';
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
