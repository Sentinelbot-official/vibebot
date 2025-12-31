const logger = require('../utils/logger');
const db = require('../utils/database');

// Track users in voice channels
const voiceTracking = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      const userId = newState.id;
      const guildId = newState.guild.id;

      // User joined a voice channel
      if (!oldState.channelId && newState.channelId) {
        voiceTracking.set(userId, {
          joinedAt: Date.now(),
          channelId: newState.channelId,
          guildId: guildId,
        });
        logger.info(
          `${newState.member.user.tag} joined voice channel in ${newState.guild.name}`
        );
      }

      // User left a voice channel
      else if (oldState.channelId && !newState.channelId) {
        const tracking = voiceTracking.get(userId);

        if (tracking) {
          const timeSpent = Date.now() - tracking.joinedAt;
          const minutesSpent = Math.floor(timeSpent / 60000);

          // Only give XP if they were in voice for at least 1 minute
          if (minutesSpent >= 1) {
            // Get voice stats
            const voiceStats = db.get('voice_stats', userId) || {
              totalMinutes: 0,
              totalSessions: 0,
              xp: 0,
              level: 1,
            };

            // Calculate XP (1 XP per minute, bonus for longer sessions)
            let xpGained = minutesSpent;
            if (minutesSpent >= 60) xpGained = Math.floor(minutesSpent * 1.5); // 50% bonus for 1+ hour
            if (minutesSpent >= 180) xpGained = Math.floor(minutesSpent * 2); // 100% bonus for 3+ hours

            voiceStats.totalMinutes += minutesSpent;
            voiceStats.totalSessions += 1;
            voiceStats.xp += xpGained;

            // Check for level up
            const xpNeeded = voiceStats.level * 500;
            if (voiceStats.xp >= xpNeeded) {
              voiceStats.level += 1;
              voiceStats.xp -= xpNeeded;

              // Notify user of level up
              try {
                const member = await newState.guild.members.fetch(userId);
                await member
                  .send(
                    `🎤 **Voice Level Up!**\nYou've reached voice level **${voiceStats.level}** in ${newState.guild.name}!`
                  )
                  .catch(() => {});
              } catch {}
            }

            db.set('voice_stats', userId, voiceStats);
            logger.info(
              `${newState.member.user.tag} earned ${xpGained} voice XP (${minutesSpent} minutes)`
            );
          }

          voiceTracking.delete(userId);
        }
      }

      // User switched channels (track as continuous session)
      else if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId
      ) {
        const tracking = voiceTracking.get(userId);
        if (tracking) {
          tracking.channelId = newState.channelId;
        }
      }
    } catch (error) {
      logger.error('Error in voice XP tracking:', error);
    }
  },
};

// Periodic save (every 5 minutes) for users still in voice
setInterval(
  () => {
    const now = Date.now();

    for (const [userId, tracking] of voiceTracking.entries()) {
      const timeSpent = now - tracking.joinedAt;
      const minutesSpent = Math.floor(timeSpent / 60000);

      if (minutesSpent >= 5) {
        // Save progress
        const voiceStats = db.get('voice_stats', userId) || {
          totalMinutes: 0,
          totalSessions: 0,
          xp: 0,
          level: 1,
        };

        const xpGained = minutesSpent;
        voiceStats.totalMinutes += minutesSpent;
        voiceStats.xp += xpGained;

        // Check for level up
        const xpNeeded = voiceStats.level * 500;
        if (voiceStats.xp >= xpNeeded) {
          voiceStats.level += 1;
          voiceStats.xp -= xpNeeded;
        }

        db.set('voice_stats', userId, voiceStats);

        // Reset tracking start time
        tracking.joinedAt = now;
      }
    }
  },
  5 * 60 * 1000
); // Every 5 minutes
