const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../utils/config');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    try {
      // Get individual config values
      const version = config.getBotConfig('version') || '2.2.0';
      const originStory =
        config.getBotConfig('origin_story') || 'Built 24/7 on stream';
      const tagline = config.getBotConfig('tagline') || "Let's vibe together!";
      const twitchUrl =
        config.getBotConfig('twitch') || 'https://twitch.tv/projectdraguk';

      logger.success(`🎵 ${client.user.tag} is now LIVE!`);

      // Shard information
      if (client.shard) {
        logger.info(
          `🔷 Shard ${client.shard.ids[0]} of ${client.shard.count} total shards`
        );
      }

      logger.info(`📊 Serving ${client.guilds.cache.size} servers`);
      logger.info(`👥 Watching over ${client.users.cache.size} users`);
      logger.info(`⚡ ${client.commands.size} commands loaded and ready`);
      logger.info(`🎬 ${originStory}`);
      logger.success(`💜 ${tagline}`);

      // Set dynamic status messages
      const activities = [
        {
          name: `🎵 ${client.guilds.cache.size} servers vibing!`,
          type: ActivityType.Watching,
        },
        {
          name: `🔴 Built 24/7 live on Twitch!`,
          type: ActivityType.Streaming,
          url: twitchUrl,
        },
        {
          name: `💜 ${client.users.cache.size} community members`,
          type: ActivityType.Listening,
        },
        {
          name: `⚡ ${client.commands.size} commands ready!`,
          type: ActivityType.Playing,
        },
        { name: `🚀 v${version} | //help`, type: ActivityType.Playing },
        { name: `🎮 Coded 24/7 with global chat!`, type: ActivityType.Playing },
        {
          name: `🔴 LIVE NOW - twitch.tv/projectdraguk`,
          type: ActivityType.Streaming,
          url: twitchUrl,
        },
      ];

      let currentActivity = 0;

      // Set initial status
      client.user.setPresence({
        activities: [activities[0]],
        status: 'online',
      });

      // Rotate status every 30 seconds
      setInterval(() => {
        try {
          currentActivity = (currentActivity + 1) % activities.length;
          client.user.setPresence({
            activities: [activities[currentActivity]],
            status: 'online',
          });
        } catch (error) {
          logger.error('Error rotating status:', error);
        }
      }, 30000);

      logger.success('🎭 Dynamic status rotation started!');

      // Initialize birthday checker
      try {
        const birthdayChecker = require('./birthdayChecker');
        if (birthdayChecker.init) {
          birthdayChecker.init(client);
        }
      } catch (error) {
        logger.warn('Birthday checker not available:', error.message);
      }
    } catch (error) {
      logger.error('Error in clientReady event:', error.message);
      logger.error('Stack trace:', error.stack);
      logger.error('Full error:', JSON.stringify(error, null, 2));
      // Continue anyway - bot should still work
    }
  },
};
