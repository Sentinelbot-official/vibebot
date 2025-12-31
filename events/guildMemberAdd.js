const logger = require('../utils/logger');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      // Get guild settings
      const settings = db.get('guild_settings', member.guild.id) || {};

      // Auto-role system
      if (settings.autoRoles && settings.autoRoles.length > 0) {
        for (const roleId of settings.autoRoles) {
          const role = member.guild.roles.cache.get(roleId);
          if (role && member.guild.members.me.permissions.has('ManageRoles')) {
            try {
              await member.roles.add(role);
              logger.info(
                `Auto-role assigned: ${role.name} to ${member.user.tag} in ${member.guild.name}`
              );
            } catch (error) {
              logger.error(`Failed to assign auto-role ${role.name}:`, error);
            }
          }
        }
      }

      // Account age verification
      if (
        settings.accountAgeVerification &&
        settings.accountAgeVerification.enabled
      ) {
        const minAge = settings.accountAgeVerification.minDays || 7;
        const accountAge = Date.now() - member.user.createdTimestamp;
        const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));

        if (accountAgeDays < minAge) {
          // Account too new
          const action = settings.accountAgeVerification.action || 'kick';
          const reason = `Account age verification failed: Account is ${accountAgeDays} days old (minimum: ${minAge} days)`;

          if (action === 'kick' && member.kickable) {
            await member.kick(reason);
            logger.warn(
              `Kicked ${member.user.tag} from ${member.guild.name}: ${reason}`
            );
          } else if (action === 'ban' && member.bannable) {
            await member.ban({ reason });
            logger.warn(
              `Banned ${member.user.tag} from ${member.guild.name}: ${reason}`
            );
          }

          // Log to server logs channel if configured
          if (settings.logsChannel) {
            const logsChannel = member.guild.channels.cache.get(
              settings.logsChannel
            );
            if (logsChannel) {
              logsChannel
                .send(
                  `⚠️ **Account Age Verification**\nUser: ${member.user.tag} (${member.id})\nAction: ${action}\nReason: ${reason}`
                )
                .catch(() => {});
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error in guildMemberAdd event:', error);
    }
  },
};
