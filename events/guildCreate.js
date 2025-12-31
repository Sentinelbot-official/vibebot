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

      // Send welcome message if channel found
      if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎵 Thanks for inviting Vibe Bot!')
          .setDescription(
            '**Hey there!** Thanks for adding me to your server!\n\n' +
              '**Getting Started:**\n' +
              '• Use `//help` to see all commands\n' +
              '• Use `//setup` to configure the bot\n' +
              '• Use `//prefix <new_prefix>` to change my prefix\n\n' +
              '**Quick Links:**\n' +
              '🌐 [Website](https://sentinelbot-official.github.io/vibebot/)\n' +
              '💬 [Support Server](https://discord.gg/zFMgG6ZN68)\n' +
              '📺 [24/7 Live Stream](https://twitch.tv/projectdraguk)\n' +
              '💎 [Get Premium](https://ko-fi.com/airis0)\n\n' +
              '**Built 24/7 live on Twitch with the community!** 💜'
          )
          .setThumbnail(guild.client.user.displayAvatarURL())
          .setFooter({
            text: 'Need help? Join our support server!',
          })
          .setTimestamp();

        try {
          await welcomeChannel.send({ embeds: [welcomeEmbed] });
        } catch (error) {
          logger.error('Failed to send welcome message:', error);
        }
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
        const webhookEmbed = {
          color: 0x00ff00,
          title: '✅ Bot Joined New Guild',
          description:
            `**Guild:** ${guild.name}\n` +
            `**ID:** \`${guild.id}\`\n` +
            `**Members:** ${guild.memberCount}\n` +
            `**Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
            `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
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
