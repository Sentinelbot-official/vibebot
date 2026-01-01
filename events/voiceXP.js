const db = require('../utils/database');
const { EmbedBuilder } = require('discord.js');
const branding = require('../utils/branding');

// Track voice sessions
const voiceSessions = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const member = newState.member;
    const guild = newState.guild;

    // Check if voice XP is enabled
    const config = db.get('voice_xp_config', guild.id) || {
      enabled: true,
      xpPerMinute: 5,
      afkChannelXP: false,
    };

    if (!config.enabled) return;

    // User joined a voice channel
    if (!oldState.channelId && newState.channelId) {
      // Don't track AFK channel unless enabled
      if (
        !config.afkChannelXP &&
        newState.channelId === guild.afkChannelId
      ) {
        return;
      }

      // Start tracking session
      voiceSessions.set(member.id, {
        guildId: guild.id,
        channelId: newState.channelId,
        joinTime: Date.now(),
        muted: newState.selfMute || newState.serverMute,
        deafened: newState.selfDeaf || newState.serverDeaf,
      });
    }

    // User left a voice channel
    if (oldState.channelId && !newState.channelId) {
      const session = voiceSessions.get(member.id);
      if (!session) return;

      // Calculate time spent
      const timeSpent = Date.now() - session.joinTime;
      const minutesSpent = Math.floor(timeSpent / 60000);

      if (minutesSpent > 0) {
        // Award XP
        const xpEarned = minutesSpent * config.xpPerMinute;
        awardVoiceXP(member, guild, xpEarned, minutesSpent);
      }

      voiceSessions.delete(member.id);
    }

    // User switched channels
    if (
      oldState.channelId &&
      newState.channelId &&
      oldState.channelId !== newState.channelId
    ) {
      const session = voiceSessions.get(member.id);
      if (session) {
        // Calculate XP for previous channel
        const timeSpent = Date.now() - session.joinTime;
        const minutesSpent = Math.floor(timeSpent / 60000);

        if (minutesSpent > 0) {
          const xpEarned = minutesSpent * config.xpPerMinute;
          awardVoiceXP(member, guild, xpEarned, minutesSpent);
        }

        // Start new session
        session.channelId = newState.channelId;
        session.joinTime = Date.now();
      }
    }

    // Update mute/deaf status
    if (oldState.channelId && newState.channelId) {
      const session = voiceSessions.get(member.id);
      if (session) {
        session.muted = newState.selfMute || newState.serverMute;
        session.deafened = newState.selfDeaf || newState.serverDeaf;
      }
    }
  },
};

function awardVoiceXP(member, guild, xpEarned, minutesSpent) {
  const userData = db.get('users', member.id) || {
    xp: 0,
    level: 1,
    voiceTime: 0,
    voiceXP: 0,
  };

  userData.voiceTime = (userData.voiceTime || 0) + minutesSpent;
  userData.voiceXP = (userData.voiceXP || 0) + xpEarned;
  userData.xp += xpEarned;

  // Check for level up
  const oldLevel = userData.level;
  const xpNeeded = oldLevel * 100;

  if (userData.xp >= xpNeeded) {
    userData.level++;
    userData.xp -= xpNeeded;

    // Send level up message
    try {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('🎤 Voice Level Up!')
        .setDescription(
          `${member} just reached **Voice Level ${userData.level}**!\n\n` +
            `🎙️ Total Voice Time: ${formatTime(userData.voiceTime)}\n` +
            `⭐ Voice XP Earned: ${userData.voiceXP.toLocaleString()}`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      // Try to send to a system channel
      const systemChannel =
        guild.systemChannel ||
        guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));

      if (systemChannel) {
        systemChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Failed to send voice level up message:', error);
    }
  }

  db.set('users', member.id, userData);
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Award XP every 5 minutes for active voice users
setInterval(() => {
  for (const [memberId, session] of voiceSessions.entries()) {
    // Skip if muted or deafened (not actively participating)
    if (session.muted || session.deafened) continue;

    const timeSpent = Date.now() - session.joinTime;
    const minutesSpent = Math.floor(timeSpent / 60000);

    // Award XP every 5 minutes
    if (minutesSpent >= 5) {
      const guild = require('discord.js').client?.guilds?.cache.get(
        session.guildId
      );
      if (!guild) continue;

      const member = guild.members.cache.get(memberId);
      if (!member) continue;

      const config = db.get('voice_xp_config', session.guildId) || {
        xpPerMinute: 5,
      };

      const xpEarned = 5 * config.xpPerMinute;
      awardVoiceXP(member, guild, xpEarned, 5);

      // Reset join time
      session.joinTime = Date.now();
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes
