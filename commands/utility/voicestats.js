const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'voicestats',
  description: 'View your voice activity statistics',
  usage: '//voicestats [@user]',
  aliases: ['vstats', 'voicetime', 'vtime'],
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const targetUser = message.mentions.users.first() || message.author;
    const userData = db.get('users', targetUser.id) || {
      voiceTime: 0,
      voiceXP: 0,
      level: 1,
    };

    const voiceTime = userData.voiceTime || 0;
    const voiceXP = userData.voiceXP || 0;

    // Format time
    const hours = Math.floor(voiceTime / 60);
    const minutes = voiceTime % 60;
    const timeDisplay =
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Get voice leaderboard position
    const allUsers = db.all('users');
    const sortedUsers = Object.entries(allUsers)
      .map(([id, data]) => ({
        id,
        voiceTime: data.voiceTime || 0,
      }))
      .sort((a, b) => b.voiceTime - a.voiceTime);

    const position =
      sortedUsers.findIndex(u => u.id === targetUser.id) + 1;

    // Calculate XP to next level
    const xpNeeded = userData.level * 100;
    const xpProgress = userData.xp || 0;
    const xpPercent = Math.floor((xpProgress / xpNeeded) * 100);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle(`🎤 ${targetUser.username}'s Voice Statistics`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '⏰ Total Voice Time',
          value: timeDisplay,
          inline: true,
        },
        {
          name: '⭐ Voice XP Earned',
          value: voiceXP.toLocaleString(),
          inline: true,
        },
        {
          name: '📊 Voice Level',
          value: `Level ${userData.level}`,
          inline: true,
        },
        {
          name: '🏆 Server Rank',
          value: position > 0 ? `#${position}` : 'Unranked',
          inline: true,
        },
        {
          name: '📈 Progress to Next Level',
          value: `${xpProgress}/${xpNeeded} XP (${xpPercent}%)`,
          inline: true,
        },
        {
          name: '💬 Total XP',
          value: (userData.xp || 0).toLocaleString(),
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
