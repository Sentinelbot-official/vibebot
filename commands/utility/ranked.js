const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'ranked',
  aliases: ['rank', 'elo', 'rating'],
  description: 'View ranked leaderboards and ELO ratings',
  usage: '[category]',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const category = args[0]?.toLowerCase() || 'overall';

    const rankings = db.get('rankings', message.guild.id) || {};
    const userRank = rankings[message.author.id] || {
      elo: 1000,
      wins: 0,
      losses: 0,
      rank: 'Unranked',
    };

    const allRankings = Object.entries(rankings)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.elo - a.elo);

    const userPosition =
      allRankings.findIndex(r => r.userId === message.author.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(getRankColor(userRank.rank))
      .setTitle('🏆 Ranked Leaderboard')
      .setDescription(
        `**Your Rank:** ${userRank.rank}\n` +
          `**ELO Rating:** ${userRank.elo}\n` +
          `**Position:** #${userPosition || 'Unranked'}\n` +
          `**W/L:** ${userRank.wins}/${userRank.losses}\n\n` +
          '**Top 10:**\n' +
          allRankings
            .slice(0, 10)
            .map(
              (r, i) => `${i + 1}. <@${r.userId}> - ${r.elo} ELO (${r.rank})`
            )
            .join('\n')
      )
      .addFields({
        name: '📊 Rank Tiers',
        value:
          '🥉 **Bronze:** 0-999\n' +
          '🥈 **Silver:** 1000-1499\n' +
          '🥇 **Gold:** 1500-1999\n' +
          '💎 **Platinum:** 2000-2499\n' +
          '💠 **Diamond:** 2500-2999\n' +
          '👑 **Master:** 3000+',
        inline: false,
      })
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

function getRankColor(rank) {
  const colors = {
    Unranked: '#95a5a6',
    Bronze: '#cd7f32',
    Silver: '#c0c0c0',
    Gold: '#ffd700',
    Platinum: '#e5e4e2',
    Diamond: '#b9f2ff',
    Master: '#9b59b6',
  };
  return colors[rank] || colors.Unranked;
}
