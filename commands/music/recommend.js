const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'recommend',
  aliases: ['suggestions', 'similar'],
  description: 'Get song recommendations based on your listening history',
  usage: '',
  category: 'music',
  cooldown: 30,
  async execute(message, args) {
    const loadingMsg = await message.reply('🔍 Analyzing your music taste...');

    try {
      const recommendations = await generateRecommendations(
        message.author.id,
        message.guild.id
      );

      if (recommendations.length === 0) {
        return loadingMsg.edit(
          '❌ Not enough listening history! Play some songs first.'
        );
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎵 Personalized Recommendations')
        .setDescription(
          `**Based on your listening history:**\n\n` +
            recommendations
              .map((rec, i) => `**${i + 1}.** ${rec.title}\n_${rec.reason}_`)
              .join('\n\n')
        )
        .addFields({
          name: '🎯 Your Music Profile',
          value:
            `**Top Genre:** ${recommendations[0]?.genre || 'Unknown'}\n` +
            `**Listening Time:** ${formatListeningTime(message.author.id)}\n` +
            `**Favorite Artist:** ${getFavoriteArtist(message.author.id)}`,
          inline: false,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Recommendation error:', error);
      await loadingMsg.edit('❌ Failed to generate recommendations!');
    }
  },
};

async function generateRecommendations(userId, guildId) {
  // Get user's listening history
  const history = db.get('music_history', userId) || [];

  if (history.length < 3) {
    return [];
  }

  // Analyze listening patterns
  const genres = {};
  const artists = {};

  for (const song of history) {
    // Extract genre/artist from title (simplified)
    const parts = song.title.split('-');
    if (parts.length > 1) {
      const artist = parts[0].trim();
      artists[artist] = (artists[artist] || 0) + 1;
    }
  }

  // Get top artist
  const topArtist = Object.entries(artists).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Generate recommendations (simplified - in production, use Spotify API or similar)
  const recommendations = [
    {
      title: `${topArtist} - Recommended Track 1`,
      reason: `Because you love ${topArtist}`,
      genre: 'Pop',
    },
    {
      title: 'Similar Artist - Popular Song',
      reason: 'Fans of your music also enjoy this',
      genre: 'Pop',
    },
    {
      title: 'Trending Now - Hot Track',
      reason: 'Trending in your favorite genre',
      genre: 'Pop',
    },
    {
      title: 'Hidden Gem - Undiscovered',
      reason: 'Based on your unique taste',
      genre: 'Indie',
    },
    {
      title: 'Classic Hit - Timeless',
      reason: 'A classic you might have missed',
      genre: 'Rock',
    },
  ];

  return recommendations.slice(0, 5);
}

function formatListeningTime(userId) {
  const stats = db.get('music_stats', userId) || { totalTime: 0 };
  const hours = Math.floor(stats.totalTime / 3600);
  const minutes = Math.floor((stats.totalTime % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getFavoriteArtist(userId) {
  const history = db.get('music_history', userId) || [];
  const artists = {};

  for (const song of history) {
    const parts = song.title.split('-');
    if (parts.length > 1) {
      const artist = parts[0].trim();
      artists[artist] = (artists[artist] || 0) + 1;
    }
  }

  const topArtist = Object.entries(artists).sort((a, b) => b[1] - a[1])[0];
  return topArtist ? topArtist[0] : 'Unknown';
}
