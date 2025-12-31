const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const db = require('../utils/database');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    try {
      // Log to console and file
      logger.success(
        `✅ Joined new guild: ${guild.name} (${guild.id}) | Members: ${guild.memberCount} | Owner: ${guild.ownerId}`
      );

      // Store guild join timestamp
      const guildData = {
        id: guild.id,
        name: guild.name,
        joinedAt: Date.now(),
        memberCount: guild.memberCount,
        ownerId: guild.ownerId,
      };
      db.set('guild_joins', guild.id, guildData);

      // Try to find a suitable channel to send welcome message
      let welcomeChannel = null;

      // Try to find a general/welcome channel
      const channelNames = ['general', 'welcome', 'bot-commands', 'commands'];
      for (const name of channelNames) {
        welcomeChannel = guild.channels.cache.find(
          channel =>
            channel.name.includes(name) &&
            channel.isTextBased() &&
            channel.permissionsFor(guild.members.me).has('SendMessages')
        );
        if (welcomeChannel) break;
      }

      // If no suitable channel found, use the first text channel we can send to
      if (!welcomeChannel) {
        welcomeChannel = guild.channels.cache.find(
          channel =>
            channel.isTextBased() &&
            channel.permissionsFor(guild.members.me).has('SendMessages')
        );
      }

      // Calculate server age
      const serverAge = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));
      const serverAgeYears = (serverAge / 365).toFixed(1);

      // Determine server size category
      let sizeCategory = '🌱 Small';
      if (guild.memberCount >= 10000) sizeCategory = '🏰 Massive';
      else if (guild.memberCount >= 1000) sizeCategory = '🏙️ Large';
      else if (guild.memberCount >= 100) sizeCategory = '🏘️ Medium';

      // Send welcome message if channel found
      if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎵 Thanks for inviting Vibe Bot!')
          .setDescription(
            `**Hey ${guild.name}!** Thanks for adding me to your ${sizeCategory} server!\n\n` +
              `I'm excited to serve your **${guild.memberCount.toLocaleString()} members**! 💜\n\u200b`
          )
          .addFields(
            {
              name: '🚀 Quick Start',
              value: 
                '• `//help` - See all commands\n' +
                '• `//setup` - Configure the bot\n' +
                '• `//prefix <new>` - Change prefix\n' +
                '• `//premium` - Learn about premium features',
              inline: true,
            },
            {
              name: '⭐ Popular Features',
              value: 
                '• Economy & Leveling System\n' +
                '• Advanced Moderation Tools\n' +
                '• Auto-Moderation & Anti-Raid\n' +
                '• Custom Embeds & Announcements\n' +
                '• Giveaways & Reaction Roles',
              inline: true,
            },
            {
              name: '🔗 Quick Links',
              value: 
                '[Website](https://sentinelbot-official.github.io/vibebot/) • ' +
                '[Support](https://discord.gg/zFMgG6ZN68) • ' +
                '[Live Stream](https://twitch.tv/projectdraguk) • ' +
                '[Premium](https://ko-fi.com/airis0)',
              inline: false,
            }
          )
          .setThumbnail(guild.client.user.displayAvatarURL())
          .setImage('https://sentinelbot-official.github.io/vibebot/banner.png')
          .setFooter({
            text: `Built 24/7 live on Twitch with the community! | Server #${guild.client.guilds.cache.size}`,
            iconURL: guild.iconURL(),
          })
          .setTimestamp();

        try {
          await welcomeChannel.send({ embeds: [welcomeEmbed] });
          logger.info(`✅ Welcome message sent to ${guild.name}`);
        } catch (error) {
          logger.error('Failed to send welcome message:', error);
        }
      } else {
        logger.warn(`⚠️ Could not find suitable channel in ${guild.name} for welcome message`);
      }

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
        // Enhanced analytics
        const verificationLevel = ['None', 'Low', 'Medium', 'High', 'Very High'][guild.verificationLevel] || 'Unknown';
        const boostTier = guild.premiumTier || 0;
        const boostCount = guild.premiumSubscriptionCount || 0;

        const webhookEmbed = {
          color: 0x00ff00,
          title: '✅ Bot Joined New Guild',
          description:
            `**Guild:** ${guild.name}\n` +
            `**ID:** \`${guild.id}\`\n` +
            `**Members:** ${guild.memberCount.toLocaleString()} (${sizeCategory})\n` +
            `**Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
            `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R> (${serverAgeYears} years old)`,
          fields: [
            {
              name: '📊 Server Stats',
              value: 
                `**Channels:** ${guild.channels.cache.size}\n` +
                `**Roles:** ${guild.roles.cache.size}\n` +
                `**Emojis:** ${guild.emojis.cache.size}`,
              inline: true,
            },
            {
              name: '🔒 Security',
              value: 
                `**Verification:** ${verificationLevel}\n` +
                `**Boost Tier:** ${boostTier}\n` +
                `**Boosts:** ${boostCount}`,
              inline: true,
            },
            {
              name: '🌐 Features',
              value: guild.features.length > 0 
                ? guild.features.slice(0, 5).join(', ') + (guild.features.length > 5 ? '...' : '')
                : 'None',
              inline: false,
            },
          ],
          thumbnail: {
            url: guild.iconURL() || guild.client.user.displayAvatarURL(),
          },
          footer: {
            text: `Total Guilds: ${guild.client.guilds.cache.size} | Total Members: ${guild.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}`,
          },
          timestamp: new Date().toISOString(),
        };

        await axios.post(webhookUrl, {
          embeds: [webhookEmbed],
        });
      } catch (error) {
        logger.error(
          'Failed to send guild join notification to webhook:',
          error
        );
      }

      // Update bot stats
      logger.info(`Bot is now in ${guild.client.guilds.cache.size} guilds`);
    } catch (error) {
      logger.error('Error in guildCreate event:', error);
    }
  },
};
