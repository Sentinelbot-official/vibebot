const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../utils/database');
const logger = require('../utils/logger');

// Track recent joins per guild
const recentJoins = new Map();

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const settings = db.get('guild_settings', member.guild.id) || {};
    const antiRaid = settings.antiRaid || {
      enabled: false,
      threshold: 5,
      timeWindow: 10,
    };

    if (!antiRaid.enabled) return;

    const guildId = member.guild.id;
    const now = Date.now();

    // Initialize or get recent joins for this guild
    if (!recentJoins.has(guildId)) {
      recentJoins.set(guildId, []);
    }

    const joins = recentJoins.get(guildId);

    // Add this join
    joins.push({ userId: member.id, timestamp: now });

    // Remove joins older than the time window
    const timeWindow = antiRaid.timeWindow * 1000; // Convert to ms
    const validJoins = joins.filter(j => now - j.timestamp < timeWindow);
    recentJoins.set(guildId, validJoins);

    // Check if threshold exceeded
    if (validJoins.length >= antiRaid.threshold) {
      logger.warn(
        `[Anti-Raid] Possible raid detected in ${member.guild.name} - ${validJoins.length} joins in ${antiRaid.timeWindow}s`
      );

      // Kick the raiders if bot has permission
      if (
        member.guild.members.me.permissions.has(
          PermissionsBitField.Flags.KickMembers
        )
      ) {
        for (const join of validJoins) {
          try {
            const raidMember = await member.guild.members.fetch(join.userId);
            if (raidMember.kickable) {
              await raidMember.kick(
                'Anti-raid protection: Suspicious join pattern'
              );
              logger.info(`[Anti-Raid] Kicked ${raidMember.user.tag}`);
            }
          } catch (error) {
            logger.error(`[Anti-Raid] Failed to kick member: ${error.message}`);
          }
        }
      }

      // Log to log channel
      if (settings.logChannel) {
        const logChannel = member.guild.channels.cache.get(settings.logChannel);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🚨 RAID DETECTED')
            .setDescription(
              `**${validJoins.length} members** joined within **${antiRaid.timeWindow} seconds**!\n\n` +
                `Anti-raid protection has been triggered.`
            )
            .addFields(
              {
                name: 'Action Taken',
                value: member.guild.members.me.permissions.has(
                  PermissionsBitField.Flags.KickMembers
                )
                  ? 'Members kicked'
                  : 'No action (missing permissions)',
                inline: false,
              },
              {
                name: 'Recommendation',
                value:
                  'Consider enabling verification or reviewing server security settings.',
                inline: false,
              }
            )
            .setTimestamp();

          try {
            await logChannel.send({ embeds: [embed] });
          } catch (error) {
            logger.error(`[Anti-Raid] Failed to send log: ${error.message}`);
          }
        }
      }

      // Clear the joins after handling
      recentJoins.set(guildId, []);
    }
  },
};
