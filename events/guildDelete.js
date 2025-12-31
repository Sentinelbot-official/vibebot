const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const db = require('../utils/database');

module.exports = {
  name: 'guildDelete',
  async execute(guild) {
    try {
      // Log to console and file
      logger.warn(
        `❌ Left guild: ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`
      );

      // Get join data to calculate how long bot was in the guild
      const joinData = db.get('guild_joins', guild.id);
      const timeInGuild = joinData
        ? Math.floor((Date.now() - joinData.joinedAt) / (1000 * 60 * 60 * 24))
        : 'Unknown';

      // Store guild leave data
      const leaveData = {
        id: guild.id,
        name: guild.name,
        leftAt: Date.now(),
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
        timeInGuild: timeInGuild,
      };
      db.set('guild_leaves', guild.id, leaveData);

      // Clean up guild-specific data (optional - you may want to keep for recovery)
      // Uncomment if you want to clean up data when bot leaves
      // db.delete('guild_settings', guild.id);
      // db.delete('premium_servers', guild.id);

      // Notify bot owner (if configured)
      const ownerCheck = require('../utils/ownerCheck');
      const ownerId = ownerCheck.getOwnerIds()[0]; // Get first owner

      if (ownerId) {
        try {
          const owner = await guild.client.users.fetch(ownerId);
          const ownerEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Bot Left Guild')
            .setDescription(
              `**Guild:** ${guild.name}\n` +
                `**ID:** \`${guild.id}\`\n` +
                `**Members:** ${guild.memberCount}\n` +
                `**Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
                `**Time in Guild:** ${timeInGuild !== 'Unknown' ? `${timeInGuild} days` : 'Unknown'}\n` +
                `**Reason:** ${guild.available ? 'Kicked/Removed' : 'Guild Outage'}`
            )
            .setThumbnail(guild.iconURL() || guild.client.user.displayAvatarURL())
            .setFooter({
              text: `Total Guilds: ${guild.client.guilds.cache.size}`,
            })
            .setTimestamp();

          await owner.send({ embeds: [ownerEmbed] });
        } catch (error) {
          logger.error('Failed to notify owner of guild leave:', error);
        }
      }

      // Check if guild had premium and log it
      const premium = require('../utils/premium');
      const premiumData = premium.getServerPremium(guild.id);
      if (premiumData) {
        logger.warn(
          `⚠️ Guild ${guild.name} (${guild.id}) had ${premiumData.tier.toUpperCase()} premium!`
        );
      }

      // Update bot stats
      logger.info(`Bot is now in ${guild.client.guilds.cache.size} guilds`);
    } catch (error) {
      logger.error('Error in guildDelete event:', error);
    }
  },
};
