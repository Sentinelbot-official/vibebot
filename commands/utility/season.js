const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'season',
  aliases: ['seasons', 'competitive'],
  description: 'View seasonal competition info and rewards',
  usage: '',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const currentSeason = getCurrentSeason();
    const userStats = db.get('season_stats', `${message.guild.id}_${message.author.id}`) || {
      points: 0,
      wins: 0,
      participated: 0,
    };

    const leaderboard = getSeasonLeaderboard(message.guild.id);
    const userRank = leaderboard.findIndex(u => u.userId === message.author.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle(`🏆 Season ${currentSeason.number} - ${currentSeason.name}`)
      .setDescription(
        `**Season Ends:** <t:${Math.floor(currentSeason.endDate / 1000)}:R>\n\n` +
          `**Your Stats:**\n` +
          `📊 Points: ${branding.formatNumber(userStats.points)}\n` +
          `🏆 Wins: ${userStats.wins}\n` +
          `🎮 Events Participated: ${userStats.participated}\n` +
          `📈 Rank: #${userRank || 'Unranked'}\n\n` +
          `**Top 5:**\n` +
          leaderboard
            .slice(0, 5)
            .map((u, i) => `${i + 1}. <@${u.userId}> - ${branding.formatNumber(u.points)} pts`)
            .join('\n')
      )
      .addFields(
        {
          name: '🎁 Season Rewards',
          value:
            '🥇 **1st Place:** 50,000 coins + Legendary Badge\n' +
            '🥈 **2nd Place:** 30,000 coins + Epic Badge\n' +
            '🥉 **3rd Place:** 20,000 coins + Rare Badge\n' +
            '🏅 **Top 10:** 10,000 coins + Participant Badge',
          inline: false,
        },
        {
          name: '📊 How to Earn Points',
          value:
            '• Win tournaments: 100 pts\n' +
            '• Complete challenges: 50 pts\n' +
            '• Daily participation: 10 pts\n' +
            '• Ranked wins: 25 pts',
          inline: false,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

function getCurrentSeason() {
  const seasonStart = new Date('2026-01-01').getTime();
  const seasonLength = 90 * 24 * 60 * 60 * 1000; // 90 days
  const now = Date.now();
  const seasonNumber = Math.floor((now - seasonStart) / seasonLength) + 1;

  return {
    number: seasonNumber,
    name: getSeasonName(seasonNumber),
    startDate: seasonStart + (seasonNumber - 1) * seasonLength,
    endDate: seasonStart + seasonNumber * seasonLength,
  };
}

function getSeasonName(number) {
  const names = [
    'New Beginnings',
    'Rising Stars',
    'Summer Heat',
    'Autumn Glory',
    'Winter Champions',
  ];
  return names[(number - 1) % names.length];
}

function getSeasonLeaderboard(guildId) {
  const allStats = db.getAllKeys('season_stats');
  const guildStats = allStats
    .filter(key => key.startsWith(`${guildId}_`))
    .map(key => {
      const userId = key.split('_')[1];
      const stats = db.get('season_stats', key);
      return { userId, ...stats };
    })
    .sort((a, b) => b.points - a.points);

  return guildStats;
}
