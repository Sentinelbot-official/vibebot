const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premium = require('../../utils/premium');
const premiumPerks = require('../../utils/premiumPerks');
const branding = require('../../utils/branding');

module.exports = {
  name: 'rank',
  aliases: ['level', 'xp', 'rankcard'],
  description: 'Check your rank and XP with detailed statistics',
  usage: '[@user]',
  category: 'leveling',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const key = `${message.guild.id}-${user.id}`;

    // Get user level data
    const levelData = db.get('levels', key) || {
      xp: 0,
      level: 1,
      messages: 0,
      lastXpGain: 0,
    };

    const xpNeeded = levelData.level * 100;
    const progress = Math.floor((levelData.xp / xpNeeded) * 100);
    const xpToNext = xpNeeded - levelData.xp;

    // Calculate rank
    const allLevels = db.all('levels');
    const guildLevels = Object.entries(allLevels)
      .filter(([k]) => k.startsWith(message.guild.id))
      .map(([k, v]) => ({
        userId: k.split('-')[1],
        level: v.level,
        xp: v.xp,
        messages: v.messages || 0,
      }))
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      });

    const rank = guildLevels.findIndex(u => u.userId === user.id) + 1;
    const totalUsers = guildLevels.length;
    const percentile = ((1 - rank / totalUsers) * 100).toFixed(1);

    // Get premium status and multiplier
    const tierName = premium.getServerTier(message.guild.id);
    const isPremium = tierName !== 'Free';
    const xpMultiplier = premiumPerks.getXPMultiplier(message.guild.id);

    // Calculate total XP earned
    const totalXP = (levelData.level - 1) * 100 + levelData.xp;

    // Determine rank tier
    let rankTier = '🥉 Bronze';
    let rankColor = 0xcd7f32;
    if (levelData.level >= 100) {
      rankTier = '💎 Diamond';
      rankColor = 0xb9f2ff;
    } else if (levelData.level >= 75) {
      rankTier = '💍 Platinum';
      rankColor = 0xe5e4e2;
    } else if (levelData.level >= 50) {
      rankTier = '🥇 Gold';
      rankColor = 0xffd700;
    } else if (levelData.level >= 25) {
      rankTier = '🥈 Silver';
      rankColor = 0xc0c0c0;
    }

    // Get users above and below
    const userAbove = rank > 1 ? guildLevels[rank - 2] : null;
    const userBelow = rank < totalUsers ? guildLevels[rank] : null;

    // Create progress bar (20 characters)
    const progressBar =
      '█'.repeat(Math.floor(progress / 5)) +
      '░'.repeat(20 - Math.floor(progress / 5));

    const embed = new EmbedBuilder()
      .setColor(rankColor)
      .setAuthor({
        name: `${user.username}'s Rank Card ${isPremium ? '💎' : ''}`,
        iconURL: user.displayAvatarURL(),
      })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setDescription(
        `**Rank Tier:** ${rankTier}\n` +
          `**Server Rank:** #${rank} / ${totalUsers} (Top ${percentile}%)\n` +
          `${isPremium ? `**XP Multiplier:** ${xpMultiplier}x 💎\n` : ''}\u200b`
      )
      .addFields(
        {
          name: '📊 Level',
          value: `**${levelData.level}**\n${levelData.level >= 100 ? 'Max Tier!' : `Next: ${levelData.level + 1}`}`,
          inline: true,
        },
        {
          name: '⭐ Experience',
          value: `**${levelData.xp}** / ${xpNeeded}\n${xpToNext} XP to next`,
          inline: true,
        },
        {
          name: '💬 Messages',
          value: `**${levelData.messages.toLocaleString()}**\n${(totalXP / (levelData.messages || 1)).toFixed(1)} XP/msg`,
          inline: true,
        },
        {
          name: '📈 Progress to Next Level',
          value: `${progressBar} **${progress}%**`,
          inline: false,
        },
        {
          name: '📊 Statistics',
          value:
            `**Total XP:** ${totalXP.toLocaleString()}\n` +
            `**Messages/Level:** ${Math.floor(levelData.messages / levelData.level)}\n` +
            `**Avg XP/Level:** ${Math.floor(totalXP / levelData.level)}`,
          inline: true,
        },
        {
          name: '🏆 Leaderboard',
          value:
            (userAbove ? `↑ #${rank - 1}: Level ${userAbove.level}\n` : '') +
            `**→ #${rank}: Level ${levelData.level} (You)**\n` +
            (userBelow ? `↓ #${rank + 1}: Level ${userBelow.level}` : ''),
          inline: true,
        }
      );

    // Add achievements
    const achievements = [];
    if (levelData.level >= 100) achievements.push('💎 Level 100');
    else if (levelData.level >= 50) achievements.push('🥇 Level 50');
    else if (levelData.level >= 25) achievements.push('🥈 Level 25');

    if (levelData.messages >= 10000) achievements.push('💬 10K Messages');
    else if (levelData.messages >= 5000) achievements.push('💬 5K Messages');
    else if (levelData.messages >= 1000) achievements.push('💬 1K Messages');

    if (rank === 1) achievements.push('👑 Server Leader');
    else if (rank <= 3) achievements.push('🏆 Top 3');
    else if (rank <= 10) achievements.push('🥇 Top 10');

    if (achievements.length > 0) {
      embed.addFields({
        name: '🏅 Achievements',
        value: achievements.join(' • '),
        inline: false,
      });
    }

    // Add activity info
    if (levelData.lastXpGain) {
      embed.addFields({
        name: '⏰ Activity',
        value: `Last XP gain: <t:${Math.floor(levelData.lastXpGain / 1000)}:R>`,
        inline: false,
      });
    }

    embed.setFooter(branding.footers.community)
      iconURL: message.author.displayAvatarURL(),
    });
    embed.setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
