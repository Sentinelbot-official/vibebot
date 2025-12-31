const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'musicstats',
  aliases: ['mstats', 'listeninghistory'],
  description: 'View your music listening statistics',
  usage: '[@user]',
  category: 'music',
  cooldown: 10,
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const userId = target.id;

    // Get user's music stats
    const stats = db.get('music_stats', userId) || {
      totalSongsPlayed: 0,
      totalListeningTime: 0,
      favoriteGenres: {},
      topSongs: {},
      recentlyPlayed: [],
      firstSongPlayed: null,
    };

    if (stats.totalSongsPlayed === 0) {
      return message.reply(
        target.id === message.author.id
          ? '🎵 **No listening history yet!**\n\n' +
            'Start playing music with `//play` and your stats will be tracked! 💜'
          : `🎵 **${target.username} hasn't played any music yet!**`
      );
    }

    // Calculate top songs
    const topSongs = Object.entries(stats.topSongs || {})
      .sort((a, b) => b[1].plays - a[1].plays)
      .slice(0, 5);

    // Format listening time
    const hours = Math.floor(stats.totalListeningTime / 3600);
    const minutes = Math.floor((stats.totalListeningTime % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Calculate days since first song
    const daysSinceFirst = stats.firstSongPlayed
      ? Math.floor((Date.now() - stats.firstSongPlayed) / (1000 * 60 * 60 * 24))
      : 0;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setAuthor({
        name: `${target.username}'s Music Stats 🎵`,
        iconURL: target.displayAvatarURL(),
      })
      .setDescription(
        `**Total Vibes:** ${stats.totalSongsPlayed.toLocaleString()} songs played\n` +
        `**Listening Time:** ${timeStr}\n` +
        `**Member Since:** ${daysSinceFirst} days ago\n\u200b`
      )
      .setThumbnail(target.displayAvatarURL({ size: 256 }));

    // Add top songs
    if (topSongs.length > 0) {
      const topSongsText = topSongs
        .map(([ title, data], index) => {
          const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
          return `${medal} **${title}**\n   ↳ ${data.plays} play${data.plays !== 1 ? 's' : ''} • [Listen](${data.url})`;
        })
        .join('\n\n');

      embed.addFields({
        name: '🎵 Top Tracks',
        value: topSongsText,
        inline: false,
      });
    }

    // Add recently played
    if (stats.recentlyPlayed && stats.recentlyPlayed.length > 0) {
      const recentText = stats.recentlyPlayed
        .slice(0, 3)
        .map((song, index) => {
          return `${index + 1}. **${song.title}**\n   ↳ <t:${Math.floor(song.playedAt / 1000)}:R>`;
        })
        .join('\n');

      embed.addFields({
        name: '🕐 Recently Played',
        value: recentText,
        inline: false,
      });
    }

    // Add fun stats
    const avgSongsPerDay = daysSinceFirst > 0 
      ? (stats.totalSongsPlayed / daysSinceFirst).toFixed(1)
      : stats.totalSongsPlayed;

    embed.addFields({
      name: '📊 Fun Stats',
      value: 
        `**Average:** ${avgSongsPerDay} songs/day\n` +
        `**Favorites:** ${Object.keys(stats.topSongs || {}).length} unique tracks\n` +
        `**Vibe Score:** ${calculateVibeScore(stats)}/100 💜`,
      inline: false,
    });

    embed.setFooter(branding.footers.default);
    embed.setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

/**
 * Calculate a fun "vibe score" based on listening habits
 * @param {Object} stats - User's music stats
 * @returns {number} Vibe score (0-100)
 */
function calculateVibeScore(stats) {
  let score = 0;

  // Base score from total songs
  score += Math.min(stats.totalSongsPlayed * 0.5, 30);

  // Bonus for listening time (hours)
  const hours = stats.totalListeningTime / 3600;
  score += Math.min(hours * 2, 30);

  // Bonus for variety (unique songs)
  const uniqueSongs = Object.keys(stats.topSongs || {}).length;
  score += Math.min(uniqueSongs * 0.5, 20);

  // Bonus for consistency (days active)
  const daysSinceFirst = stats.firstSongPlayed
    ? Math.floor((Date.now() - stats.firstSongPlayed) / (1000 * 60 * 60 * 24))
    : 0;
  if (daysSinceFirst > 0) {
    const consistency = stats.totalSongsPlayed / daysSinceFirst;
    score += Math.min(consistency * 5, 20);
  }

  return Math.min(Math.round(score), 100);
}
