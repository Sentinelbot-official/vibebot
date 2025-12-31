const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'voiceleaderboard',
  description: 'View the server voice leaderboard',
  aliases: ['vlb', 'voicetop', 'vtop'],
  category: 'utility',
  cooldown: 10,
  async execute(message) {
    // Get all voice stats
    const allVoiceStats = db.all('voice_stats');

    if (!allVoiceStats || Object.keys(allVoiceStats).length === 0) {
      return message.reply('❌ No voice statistics available yet!');
    }

    // Convert to array and filter for guild members only
    const guildMemberStats = [];

    for (const [userId, stats] of Object.entries(allVoiceStats)) {
      const member = message.guild.members.cache.get(userId);
      if (member) {
        guildMemberStats.push({
          userId,
          username: member.user.username,
          ...stats,
        });
      }
    }

    if (guildMemberStats.length === 0) {
      return message.reply('❌ No voice statistics available for this server!');
    }

    // Sort by total minutes
    guildMemberStats.sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Get top 10
    const top10 = guildMemberStats.slice(0, 10);

    // Build leaderboard
    const leaderboard = top10
      .map((stats, index) => {
        const hours = Math.floor(stats.totalMinutes / 60);
        const medal =
          index === 0
            ? '🥇'
            : index === 1
              ? '🥈'
              : index === 2
                ? '🥉'
                : `**${index + 1}.**`;
        return `${medal} ${stats.username} - ${hours}h ${stats.totalMinutes % 60}m (Level ${stats.level})`;
      })
      .join('\n');

    // Find user's rank
    const userIndex = guildMemberStats.findIndex(
      s => s.userId === message.author.id
    );
    const userRank = userIndex !== -1 ? userIndex + 1 : 'Unranked';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🎤 ${message.guild.name} Voice Leaderboard`)
      .setDescription(leaderboard)
      .addFields({
        name: '📊 Your Rank',
        value: `#${userRank} / ${guildMemberStats.length}`,
        inline: true,
      })
      .setFooter({ text: 'Based on total time in voice channels' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
