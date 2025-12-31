const { ShardingManager } = require('discord.js');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');

// ASCII Art Header
console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ██╗   ██╗██╗██████╗ ███████╗    ██████╗  ██████╗ ████████╗   ║
║   ██║   ██║██║██╔══██╗██╔════╝    ██╔══██╗██╔═══██╗╚══██╔══╝   ║
║   ██║   ██║██║██████╔╝█████╗      ██████╔╝██║   ██║   ██║      ║
║   ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██╔══██╗██║   ██║   ██║      ║
║    ╚████╔╝ ██║██████╔╝███████╗    ██████╔╝╚██████╔╝   ██║      ║
║     ╚═══╝  ╚═╝╚═════╝ ╚══════╝    ╚═════╝  ╚═════╝    ╚═╝      ║
║                                                                   ║
║              🎵 SHARDING MANAGER - v2.2.0 🎵                     ║
║                                                                   ║
║   Built 24/7 LIVE on Twitch with the global community!          ║
║   Every shard spawned with love from the stream! 💜              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`);

const config = require('./utils/config');

// Validate token
const token = config.get('token');
if (!token) {
  logger.error('❌ DISCORD_TOKEN is not set in .env file!');
  process.exit(1);
}

// Create sharding manager
const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
  token: token,
  totalShards: 'auto', // Auto-calculate based on guild count
  respawn: true, // Auto-respawn crashed shards
  shardArgs: process.argv.slice(2), // Pass command line args to shards
});

// Shard spawn event
manager.on('shardCreate', shard => {
  logger.success(`🚀 Shard ${shard.id} launched!`);

  // Shard ready event
  shard.on('ready', () => {
    logger.success(`✅ Shard ${shard.id} is ready!`);
  });

  // Shard disconnect event
  shard.on('disconnect', () => {
    logger.warn(`⚠️ Shard ${shard.id} disconnected`);
  });

  // Shard reconnecting event
  shard.on('reconnecting', () => {
    logger.info(`🔄 Shard ${shard.id} reconnecting...`);
  });

  // Shard error event
  shard.on('error', error => {
    logger.error(`❌ Shard ${shard.id} error:`, error);
  });

  // Shard death event
  shard.on('death', () => {
    logger.error(`💀 Shard ${shard.id} died`);
  });

  // Shard spawn event
  shard.on('spawn', () => {
    logger.info(`🥚 Shard ${shard.id} spawned`);
  });
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection in Sharding Manager:', reason);
});

process.on('uncaughtException', error => {
  logger.error('🚨 Uncaught Exception in Sharding Manager:', error);
  process.exit(1);
});

// Spawn shards
logger.info('🎬 Starting Vibe Bot with sharding...');
logger.info('📊 Calculating optimal shard count...');

manager
  .spawn({ timeout: 60000 }) // 60 second timeout per shard
  .then(shards => {
    logger.success(`🎉 Successfully spawned ${shards.size} shard(s)!`);
    logger.info('🎵 All shards are now vibing!');
    logger.info('💜 Built 24/7 live on Twitch - twitch.tv/projectdraguk');
  })
  .catch(error => {
    logger.error('❌ Failed to spawn shards:', error);
    process.exit(1);
  });

// Graceful shutdown
const shutdown = async () => {
  logger.info('🛑 Shutting down sharding manager...');

  try {
    // Broadcast shutdown to all shards
    await manager.broadcastEval(client => {
      if (client.shutdown) {
        return client.shutdown.gracefulShutdown(0);
      }
      return client.destroy();
    });

    logger.success('✅ All shards shut down gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Shard stats logging (every 30 minutes)
setInterval(
  async () => {
    try {
      const promises = [
        manager.fetchClientValues('guilds.cache.size'),
        manager.fetchClientValues('users.cache.size'),
        manager.fetchClientValues('ws.ping'),
      ];

      const results = await Promise.all(promises);

      const totalGuilds = results[0].reduce((acc, val) => acc + val, 0);
      const totalUsers = results[1].reduce((acc, val) => acc + val, 0);
      const avgPing = Math.round(
        results[2].reduce((acc, val) => acc + val, 0) / results[2].length
      );

      logger.info('📊 Shard Statistics:');
      logger.info(`   Total Shards: ${manager.shards.size}`);
      logger.info(`   Total Guilds: ${totalGuilds}`);
      logger.info(`   Total Users: ${totalUsers}`);
      logger.info(`   Average Ping: ${avgPing}ms`);
    } catch (error) {
      logger.error('Error fetching shard stats:', error);
    }
  },
  30 * 60 * 1000
); // Every 30 minutes

module.exports = manager;
