/**
 * ════════════════════════════════════════════════════════════════════════════
 *                            🎵 VIBE BOT v2.7 🎵
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 🔴 Built LIVE on 24/7 Twitch Stream by Airis & The Community
 * 📺 https://twitch.tv/projectdraguk - ALWAYS LIVE!
 *
 * 🌟 This bot is special - every feature was coded live on a 24/7 stream with
 *    real-time input from viewers around the world. From 130 commands to 260+,
 *    this journey represents hundreds of hours of collaborative coding,
 *    debugging sessions at 3 AM, and an amazing global community coming together.
 *
 * 💜 Thank you to everyone who watched (any time, day or night!), suggested
 *    features, helped debug, and made this possible. This isn't just a bot -
 *    it's OUR bot, built together 24/7.
 *
 * @version 2.7.0
 * @author Airis (with help from the best 24/7 Twitch community ever!)
 * @description 230+ commands | Music System | AI-powered | Built 24/7 live on stream
 * ════════════════════════════════════════════════════════════════════════════
 */

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables first
dotenv.config();

// Import utilities
const logger = require('./utils/logger');

// Try to load config and catch any errors
let config, backup, automod, health, shutdown, statsApi;
try {
  config = require('./utils/config');
  backup = require('./utils/backup');
  automod = require('./utils/automod');
  health = require('./utils/health');
  shutdown = require('./utils/shutdown');
  statsApi = require('./utils/statsApi');
} catch (error) {
  logger.error('Failed to load utilities:', error);
  console.error('FATAL ERROR:', error);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged: Required for commands, auto-mod, modmail
    GatewayIntentBits.GuildMembers, // Privileged: Required for member events, moderation
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.User,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
  ],
  // Note: shards and shardCount are automatically set by ShardingManager
  // When running via shard.js, these are handled automatically
});

// Initialize collections
client.commands = new Collection();
client.cooldowns = new Collection();

// Health checks will be registered after bot starts

// Load command handler (supports subfolders)
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively load commands from subdirectories
      loadCommands(filePath);
    } else if (file.endsWith('.js')) {
      // Load command file
      const command = require(filePath);

      if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        const relativePath = path.relative(commandsPath, filePath);
        logger.success(`Command loaded: ${command.name} (${relativePath})`);
      } else {
        logger.warn(
          `Command at ${filePath} is missing "name" or "execute" property.`
        );
      }
    }
  }
}

if (fs.existsSync(commandsPath)) {
  loadCommands(commandsPath);
}

// Increase max listeners BEFORE loading events (we have 12 messageCreate handlers)
client.setMaxListeners(15);

// Load event handler
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    // Skip special handlers (manually initialized)
    if (file === 'birthdayChecker.js') {
      logger.info(`Skipping ${file} (manually initialized)`);
      continue;
    }

    // Skip if no execute function (not a standard event)
    if (!event.execute) {
      logger.warn(`Event ${file} has no execute function, skipping`);
      continue;
    }

    // Wrap event execution in error handler
    const executeEvent = async (...args) => {
      try {
        await event.execute(...args);
      } catch (error) {
        logger.error(`Error in event ${event.name}:`, error);
      }
    };

    if (event.once) {
      client.once(event.name, executeEvent);
    } else {
      client.on(event.name, executeEvent);
    }
    logger.success(`Event loaded: ${event.name}`);
  }
}

// Initialize shutdown handler (handles uncaughtException, unhandledRejection, SIGTERM, SIGINT)
shutdown.init(client);

// Register cleanup callbacks
shutdown.register(async () => {
  logger.info('Stopping health monitoring...');
  health.stopMonitoring();
}, 'health-monitor');

shutdown.register(async () => {
  logger.info('Creating final database backup...');
  await backup.createBackup();
}, 'final-backup');

shutdown.register(async () => {
  logger.info('Closing database connections...');
  const db = require('./utils/database');
  if (db.close) {
    db.close();
  }
}, 'database-cleanup');

/**
 * Start the bot with style! 🚀
 */
async function start() {
  try {
    logger.info('════════════════════════════════════════════════════════════');
    logger.info('🎵 Starting Vibe Bot - Built 24/7 Live on Twitch! 🎵');
    logger.info('════════════════════════════════════════════════════════════');
    logger.info(
      `🔴 24/7 Stream: https://twitch.tv/projectdraguk - ALWAYS LIVE!`
    );
    logger.info(`🌍 Environment: ${config.get('nodeEnv')}`);
    logger.info(`⚡ Prefix: ${config.get('prefix')}`);
    logger.info(`📦 Commands: ${client.commands.size}`);
    logger.info('════════════════════════════════════════════════════════════');

    // Login to Discord
    logger.info('🔐 Connecting to Discord...');
    await client.login(config.get('token'));
    logger.success('✅ Connected to Discord successfully!');

    // Start background systems
    logger.info('🔧 Starting background systems...');
    backup.startAutoBackup();
    logger.success('  ✓ Auto-backup system online');

    automod.startWarningCleanup();
    logger.success('  ✓ Auto-moderation online');

    // Register health checks
    health.registerCheck('discord', async () => {
      return {
        websocket: client.ws.ping !== -1 ? 'connected' : 'disconnected',
        ping: client.ws.ping,
        guilds: client.guilds.cache.size,
      };
    });

    health.registerCheck('database', async () => {
      const db = require('./utils/database');
      try {
        // Simple query to check database - just verify db exists
        if (db && db.get) {
          return { status: 'operational' };
        }
        return { status: 'unavailable' };
      } catch (error) {
        return { status: 'error', error: error.message };
      }
    });

    health.startMonitoring();
    logger.success('  ✓ Health monitoring online');

    // Initialize reminders
    try {
      const remindCommand = require('./commands/utility/remind');
      if (remindCommand.initReminders) {
        remindCommand.initReminders(client);
        logger.success('  ✓ Recurring reminders initialized');
      }
    } catch (err) {
      logger.warn('  ⚠ Reminders not available');
    }

    // Initialize Stats API
    statsApi.init(client);

    logger.info('════════════════════════════════════════════════════════════');
    logger.success(`🎉 Vibe Bot v${config.getBotConfig('version')} is LIVE!`);
    logger.success('💜 Built with love by Airis & The 24/7 Community');
    logger.success(
      '🔴 Coded live on stream - Watch anytime at twitch.tv/projectdraguk'
    );
    logger.success('🚀 All systems operational - Ready to vibe!');
    logger.info('════════════════════════════════════════════════════════════');
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    logger.error('💔 Something went wrong... check your configuration!');
    process.exit(1);
  }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Promise Rejection:', reason);
  logger.error('Promise:', promise);
  // Don't exit - log and continue
});

// Uncaught exceptions are handled by shutdown.init(client)

// Handle warnings
process.on('warning', warning => {
  logger.warn('Process warning:', warning.name);
  if (warning.stack) {
    logger.warn(warning.stack);
  }
});

// Start the bot
start().catch(error => {
  logger.error('Fatal error during startup:', error);
  process.exit(1);
});
