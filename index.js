const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const backup = require('./utils/backup');
const automod = require('./utils/automod');

dotenv.config();

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

// Initialize commands collection
client.commands = new Collection();

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

// Error handling
process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Login
client
  .login(process.env.TOKEN)
  .then(() => {
    logger.success('Bot logged in successfully');
    // Start auto-backup system
    backup.startAutoBackup();
    // Start auto-mod warning cleanup
    automod.startWarningCleanup();
  })
  .catch(error => {
    logger.error('Failed to login:', error);
    process.exit(1);
  });
