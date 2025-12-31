const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../utils/config');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    const botConfig = config.getBotConfig();

    logger.success(`🎵 ${client.user.tag} is now LIVE!`);
    logger.info(`📊 Serving ${client.guilds.cache.size} servers`);
    logger.info(`👥 Watching over ${client.users.cache.size} users`);
    logger.info(`⚡ ${client.commands.size} commands loaded and ready`);
    logger.info(`🎬 ${botConfig.origin_story}`);
    logger.success(`💜 ${botConfig.tagline}`);

    // Set dynamic status messages
    const activities = [
      {
        name: `🎵 ${client.guilds.cache.size} servers vibing!`,
        type: ActivityType.Watching,
      },
      {
        name: `🔴 Built 24/7 live on Twitch!`,
        type: ActivityType.Streaming,
        url: botConfig.twitch,
      },
      {
        name: `💜 ${client.users.cache.size} community members`,
        type: ActivityType.Listening,
      },
      {
        name: `⚡ ${client.commands.size} commands ready!`,
        type: ActivityType.Playing,
      },
      { name: `🚀 v${botConfig.version} | !help`, type: ActivityType.Playing },
      { name: `🎮 Coded 24/7 with global chat!`, type: ActivityType.Playing },
      {
        name: `🔴 LIVE NOW - twitch.tv/projectdraguk`,
        type: ActivityType.Streaming,
        url: botConfig.twitch,
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
      currentActivity = (currentActivity + 1) % activities.length;
      client.user.setPresence({
        activities: [activities[currentActivity]],
        status: 'online',
      });
    }, 30000);

    logger.success('🎭 Dynamic status rotation started!');
  },
};
