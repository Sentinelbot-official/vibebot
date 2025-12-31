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
      const webhookUrl = process.env.GUILD_LOG_WEBHOOK;

      if (!webhookUrl) {
        logger.warn(
          'GUILD_LOG_WEBHOOK not configured - skipping webhook notification'
        );
        return;
      }

      try {
        const axios = require('axios');
        // Calculate retention metrics
        const retentionDays = timeInGuild !== 'Unknown' ? timeInGuild : 0;
        let retentionCategory = '🔴 Very Short';
        if (retentionDays >= 365) retentionCategory = '🟢 Excellent (1+ year)';
        else if (retentionDays >= 180)
          retentionCategory = '🟡 Good (6+ months)';
        else if (retentionDays >= 90) retentionCategory = '🟠 Fair (3+ months)';
        else if (retentionDays >= 30) retentionCategory = '🟤 Short (1+ month)';

        // Check if premium
        const premium = require('../utils/premium');
        const premiumData = premium.getServerPremium(guild.id);
        const wasPremium = premiumData
          ? `💎 ${premiumData.tier.toUpperCase()}`
          : 'Free';

        const webhookEmbed = {
          color: 0xff0000,
          title: '❌ Bot Left Guild',
          description:
            `**Guild:** ${guild.name}\n` +
            `**ID:** \`${guild.id}\`\n` +
            `**Members:** ${guild.memberCount.toLocaleString()}\n` +
            `**Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
            `**Reason:** ${guild.available ? 'Kicked/Removed' : 'Guild Outage'}`,
          fields: [
            {
              name: '⏱️ Retention',
              value:
                `**Time in Guild:** ${timeInGuild !== 'Unknown' ? `${timeInGuild} days` : 'Unknown'}\n` +
                `**Category:** ${retentionCategory}\n` +
                `**Premium:** ${wasPremium}`,
              inline: true,
            },
            {
              name: '📊 Impact',
              value:
                `**Channels Lost:** ${guild.channels.cache.size}\n` +
                `**Roles Lost:** ${guild.roles.cache.size}\n` +
                `**Members Lost:** ${guild.memberCount.toLocaleString()}`,
              inline: true,
            },
          ],
          thumbnail: {
            url: guild.iconURL() || guild.client.user.displayAvatarURL(),
          },
          footer: {
            text: `Remaining Guilds: ${guild.client.guilds.cache.size} | Total Members: ${guild.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}`,
          },
          timestamp: new Date().toISOString(),
        };

        await axios.post(webhookUrl, {
          embeds: [webhookEmbed],
        });
      } catch (error) {
        logger.error(
          'Failed to send guild leave notification to webhook:',
          error
        );
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
