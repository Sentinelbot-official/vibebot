const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'voicestats',
  description: 'View voice channel statistics',
  usage: '[@user]',
  aliases: ['voicexp', 'vxp', 'vstats'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    const targetUser = message.mentions.users.first() || message.author;

    const voiceStats = db.get('voice_stats', targetUser.id) || {
      totalMinutes: 0,
      totalSessions: 0,
      xp: 0,
      level: 1,
    };

    if (voiceStats.totalMinutes === 0) {
      if (targetUser.id === message.author.id) {
        return message.reply(
          "❌ You haven't spent any time in voice channels yet!"
        );
      } else {
        return message.reply(
          `❌ ${targetUser.username} hasn\'t spent any time in voice channels yet!`
        );
      }
    }

    // Calculate time breakdowns
    const hours = Math.floor(voiceStats.totalMinutes / 60);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let timeText = '';
    if (days > 0) {
      timeText = `${days}d ${remainingHours}h`;
    } else {
      timeText = `${hours}h ${voiceStats.totalMinutes % 60}m`;
    }

    // Calculate XP progress
    const xpNeeded = voiceStats.level * 500;
    const xpProgress = Math.floor((voiceStats.xp / xpNeeded) * 100);

    // Calculate average session length
    const avgSession =
      voiceStats.totalSessions > 0
        ? Math.floor(voiceStats.totalMinutes / voiceStats.totalSessions)
        : 0;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🎤 ${targetUser.username}'s Voice Stats`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '⭐ Voice Level',
          value: voiceStats.level.toString(),
          inline: true,
        },
        {
          name: '✨ XP',
          value: `${voiceStats.xp}/${xpNeeded} (${xpProgress}%)`,
          inline: true,
        },
        { name: '⏱️ Total Time', value: timeText, inline: true },
        {
          name: '📊 Total Sessions',
          value: voiceStats.totalSessions.toLocaleString(),
          inline: true,
        },
        {
          name: '📈 Avg Session',
          value: `${avgSession} minutes`,
          inline: true,
        },
        {
          name: '🎯 Total Minutes',
          value: voiceStats.totalMinutes.toLocaleString(),
          inline: true,
        }
      )
      .setFooter({
        text: 'Voice XP is earned by spending time in voice channels',
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
