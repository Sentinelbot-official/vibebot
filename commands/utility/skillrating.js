const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'skillrating',
  aliases: ['sr', 'mmr', 'skill'],
  description: 'View your skill rating across different activities',
  usage: '',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const ratings = db.get('skill_ratings', message.author.id) || {
      overall: 1000,
      economy: 1000,
      gaming: 1000,
      social: 1000,
      competitive: 1000,
    };

    const overallRank = calculateRank(ratings.overall);
    const history = db.get('rating_history', message.author.id) || [];

    const embed = new EmbedBuilder()
      .setColor(getRankColor(overallRank))
      .setTitle(`📊 ${message.author.username}'s Skill Ratings`)
      .setDescription(
        `**Overall Rank:** ${overallRank}\n` +
          `**Overall Rating:** ${Math.round(ratings.overall)}\n\n` +
          '**Category Ratings:**'
      )
      .addFields(
        {
          name: '💰 Economy',
          value: `${Math.round(ratings.economy)} SR\n${calculateRank(ratings.economy)}`,
          inline: true,
        },
        {
          name: '🎮 Gaming',
          value: `${Math.round(ratings.gaming)} SR\n${calculateRank(ratings.gaming)}`,
          inline: true,
        },
        {
          name: '💬 Social',
          value: `${Math.round(ratings.social)} SR\n${calculateRank(ratings.social)}`,
          inline: true,
        },
        {
          name: '🏆 Competitive',
          value: `${Math.round(ratings.competitive)} SR\n${calculateRank(ratings.competitive)}`,
          inline: true,
        },
        {
          name: '📈 Recent Trend',
          value: getTrend(history),
          inline: true,
        },
        {
          name: '🎯 Next Rank',
          value: getNextRank(ratings.overall),
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

function calculateRank(rating) {
  if (rating < 500) return '🥉 Bronze';
  if (rating < 1000) return '🥈 Silver';
  if (rating < 1500) return '🥇 Gold';
  if (rating < 2000) return '💎 Platinum';
  if (rating < 2500) return '💠 Diamond';
  if (rating < 3000) return '👑 Master';
  return '🌟 Grandmaster';
}

function getRankColor(rank) {
  const colors = {
    '🥉 Bronze': '#cd7f32',
    '🥈 Silver': '#c0c0c0',
    '🥇 Gold': '#ffd700',
    '💎 Platinum': '#e5e4e2',
    '💠 Diamond': '#b9f2ff',
    '👑 Master': '#9b59b6',
    '🌟 Grandmaster': '#e74c3c',
  };
  return colors[rank] || '#95a5a6';
}

function getTrend(history) {
  if (history.length < 2) return '➡️ Stable';

  const recent = history.slice(-5);
  const change = recent[recent.length - 1] - recent[0];

  if (change > 50) return '📈 Rising Fast';
  if (change > 10) return '📈 Rising';
  if (change < -50) return '📉 Falling Fast';
  if (change < -10) return '📉 Falling';
  return '➡️ Stable';
}

function getNextRank(rating) {
  const thresholds = [500, 1000, 1500, 2000, 2500, 3000];
  const nextThreshold = thresholds.find(t => t > rating);

  if (!nextThreshold) return 'Max Rank!';

  const needed = nextThreshold - rating;
  return `${Math.round(needed)} SR needed`;
}
