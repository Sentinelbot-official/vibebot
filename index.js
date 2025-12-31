/**
 * VibeBot - Main Entry Point
 * @description A feature-rich Discord bot with 130+ commands
 * @version 2.0.0
 * @author Airis
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
const config = require('./utils/config');
const backup = require('./utils/backup');
const automod = require('./utils/automod');
const health = require('./utils/health');
const shutdown = require('./utils/shutdown');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
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
});

// Initialize collections
client.commands = new Collection();
client.cooldowns = new Collection();

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
    // Simple query to check database
    db.get('health_check', 'test');
    return { status: 'operational' };
  } catch {
    throw new Error('Database check failed');
  }
});

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

// Load event handler
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    logger.success(`Event loaded: ${event.name}`);
  }
}

// Initialize shutdown handler
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
 * Start the bot
 */
async function start() {
  try {
    logger.info('Starting VibeBot...');
    logger.info(`Environment: ${config.get('nodeEnv')}`);
    logger.info(`Prefix: ${config.get('prefix')}`);

    // Login to Discord
    await client.login(config.get('token'));
    logger.success('Bot logged in successfully');

    // Start systems
    logger.info('Starting background systems...');
    backup.startAutoBackup();
    automod.startWarningCleanup();
    health.startMonitoring();

    logger.success('All systems operational');
    logger.success(`VibeBot v${config.getBotConfig('version')} is ready!`);
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
start().catch(error => {
  logger.error('Fatal error during startup:', error);
  process.exit(1);
});
