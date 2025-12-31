const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../utils/config');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    try {
      const botConfig = config.getBotConfig();

      logger.success(`🎵 ${client.user.tag} is now LIVE!`);
      logger.info(`📊 Serving ${client.guilds.cache.size} servers`);
      logger.info(`👥 Watching over ${client.users.cache.size} users`);
      logger.info(`⚡ ${client.commands.size} commands loaded and ready`);
      logger.info(`🎬 ${botConfig.origin_story || 'Built on stream'}`);
      logger.success(`💜 ${botConfig.tagline || 'Let\'s vibe together!'}`);

      // Set dynamic status messages
      const activities = [
        {
          name: `🎵 ${client.guilds.cache.size} servers vibing!`,
          type: ActivityType.Watching,
        },
        {
          name: `🔴 Built 24/7 live on Twitch!`,
          type: ActivityType.Streaming,
          url: botConfig.twitch || 'https://twitch.tv/projectdraguk',
        },
        {
          name: `💜 ${client.users.cache.size} community members`,
          type: ActivityType.Listening,
        },
        {
          name: `⚡ ${client.commands.size} commands ready!`,
          type: ActivityType.Playing,
        },
        { name: `🚀 v${botConfig.version || '2.2.0'} | !help`, type: ActivityType.Playing },
        { name: `🎮 Coded 24/7 with global chat!`, type: ActivityType.Playing },
        {
          name: `🔴 LIVE NOW - twitch.tv/projectdraguk`,
          type: ActivityType.Streaming,
          url: botConfig.twitch || 'https://twitch.tv/projectdraguk',
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
