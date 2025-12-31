const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../utils/config');
const os = require('os');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    try {
      // Get individual config values
      const version = config.getBotConfig('version') || '2.6.0';
      const originStory =
        config.getBotConfig('origin_story') || 'Built 24/7 on stream';
      const tagline = config.getBotConfig('tagline') || "Let's vibe together!";
      const twitchUrl =
        config.getBotConfig('twitch') || 'https://twitch.tv/projectdraguk';

      logger.success(`🔴 ${client.user.tag} is now LIVE!`);
      logger.success(`🎵 ${tagline}`);
      logger.info(`🚀 Version ${version} - Built 24/7 on Twitch!`);

      // Startup diagnostics
      const startupTime = Date.now() - (client.readyTimestamp || Date.now());
      logger.info(`⚡ Startup time: ${startupTime}ms`);

      // Shard information
      if (client.shard) {
        logger.info(
          `🔷 Shard ${client.shard.ids[0]} of ${client.shard.count} total shards`
        );

        try {
          const shardGuilds =
            await client.shard.fetchClientValues('guilds.cache.size');
          const totalGuilds = shardGuilds.reduce((a, b) => a + b, 0);
          logger.info(`🌐 Total guilds across all shards: ${totalGuilds}`);
        } catch (err) {
          logger.warn('Could not fetch shard statistics');
        }
      }

      // Server and user statistics
      const totalMembers = client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      );
      logger.info(`📊 Serving ${client.guilds.cache.size} servers`);
      logger.info(
        `👥 Watching over ${totalMembers.toLocaleString()} total members`
      );
      logger.info(`👤 Cached ${client.users.cache.size} users`);
      logger.info(`📺 Monitoring ${client.channels.cache.size} channels`);
      logger.info(`⚡ ${client.commands.size} commands loaded and ready`);

      // System health check
      const memUsage = process.memoryUsage();
      const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
      const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
      logger.info(`💾 Memory: ${memUsedMB}MB / ${memTotalMB}MB`);
      logger.info(`🖥️ Platform: ${os.platform()} ${os.arch()}`);
      logger.info(`⚙️ Node.js: ${process.version}`);
      logger.info(`🔧 CPU Cores: ${os.cpus().length}`);

      // Check critical environment variables
      const criticalEnvVars = ['TOKEN', 'PREFIX'];
      const missingVars = criticalEnvVars.filter(v => !process.env[v]);
      if (missingVars.length > 0) {
        logger.warn(
          `⚠️ Missing environment variables: ${missingVars.join(', ')}`
        );
      }

      // Check optional features
      const optionalFeatures = {
        'Premium System': process.env.PREMIUM_KEY,
        'AI Features':
          process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY,
        'Guild Logging': process.env.GUILD_LOG_WEBHOOK,
        'Error Logging': process.env.ERROR_WEBHOOK,
      };

      const enabledFeatures = Object.entries(optionalFeatures)
        .filter(([_, value]) => value)
        .map(([name]) => name);

      if (enabledFeatures.length > 0) {
        logger.info(`✨ Enabled features: ${enabledFeatures.join(', ')}`);
      }

      const disabledFeatures = Object.entries(optionalFeatures)
        .filter(([_, value]) => !value)
        .map(([name]) => name);

      if (disabledFeatures.length > 0) {
        logger.debug(`💤 Disabled features: ${disabledFeatures.join(', ')}`);
      }

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
      const statusInterval = setInterval(() => {
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

      // Store interval for cleanup
      client.statusInterval = statusInterval;

      // Initialize birthday checker
      try {
        const birthdayChecker = require('./birthdayChecker');
        if (birthdayChecker.init) {
          birthdayChecker.init(client);
          logger.info('🎂 Birthday checker initialized');
        }
      } catch (error) {
        logger.debug('Birthday checker not available:', error.message);
      }

      // Health monitoring - check every 5 minutes
      setInterval(
        () => {
          try {
            const memUsage = process.memoryUsage();
            const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
            const memPercent = (
              (memUsage.heapUsed / memUsage.heapTotal) *
              100
            ).toFixed(1);

            // Warn if memory usage is high
            if (memPercent > 85) {
              logger.warn(
                `⚠️ High memory usage: ${memUsedMB}MB (${memPercent}%)`
              );
            }

            // Check WebSocket ping
            if (client.ws.ping > 500) {
              logger.warn(`⚠️ High WebSocket latency: ${client.ws.ping}ms`);
            }

            // Log health status
            logger.debug('Health check', {
              guilds: client.guilds.cache.size,
              memory: `${memUsedMB}MB`,
              ping: `${client.ws.ping}ms`,
              uptime: `${Math.floor(client.uptime / 1000 / 60)}min`,
            });
          } catch (error) {
            logger.error('Health check failed:', error);
          }
        },
        5 * 60 * 1000
      );

      logger.success('💓 Health monitoring started!');

      // Final startup message
      const readyTime = Date.now();
      logger.success(`✅ Bot fully initialized and ready to serve!`);
      logger.info(`🕐 Ready at: ${new Date(readyTime).toLocaleString()}`);
      logger.info('─'.repeat(60));
    } catch (error) {
      logger.error('Error in clientReady event:', error.message);
      logger.error('Stack trace:', error.stack);

      // Try to set a basic status even if something failed
      try {
        client.user.setPresence({
          activities: [
            {
              name: '⚠️ Startup Error - Recovering...',
              type: ActivityType.Playing,
            },
          ],
          status: 'dnd',
        });
      } catch {}

      // Continue anyway - bot should still work
    }
  },
};
