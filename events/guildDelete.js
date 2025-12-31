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

      db.delete('guild_settings', guild.id);
      db.delete('premium_servers', guild.id);

      // Send notification to webhook
      const webhookUrl = 'https://discord.com/api/webhooks/1455954343399526500/t6DTuNKHWDbnljoEKb9ABKTVVgBWT872JofXX1GQJdVU1W9zj6j_tI-8Gj2Nhm2Lfdq2';
      
      try {
        const axios = require('axios');
        const webhookEmbed = {
          color: 0xff0000,
          title: '❌ Bot Left Guild',
          description:
            `**Guild:** ${guild.name}\n` +
            `**ID:** \`${guild.id}\`\n` +
            `**Members:** ${guild.memberCount}\n` +
            `**Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
            `**Time in Guild:** ${timeInGuild !== 'Unknown' ? `${timeInGuild} days` : 'Unknown'}\n` +
            `**Reason:** ${guild.available ? 'Kicked/Removed' : 'Guild Outage'}`,
          thumbnail: {
            url: guild.iconURL() || guild.client.user.displayAvatarURL(),
          },
          footer: {
            text: `Total Guilds: ${guild.client.guilds.cache.size}`,
          },
          timestamp: new Date().toISOString(),
        };

        await axios.post(webhookUrl, {
          embeds: [webhookEmbed],
        });
      } catch (error) {
        logger.error('Failed to send guild leave notification to webhook:', error);
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
