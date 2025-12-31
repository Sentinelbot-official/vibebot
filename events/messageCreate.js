const logger = require('../utils/logger');
const cooldowns = require('../utils/cooldowns');
const db = require('../utils/database');
const ownerCheck = require('../utils/ownerCheck');
const defaultPrefix = process.env.PREFIX || '//';

module.exports = {
  name: 'messageCreate',
  execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Auto-responder system (check before command processing)
    if (message.guild) {
      const settings = db.get('guild_settings', message.guild.id) || {};
      const autoResponders = settings.autoResponders || [];

      if (autoResponders.length > 0) {
        const content = message.content.toLowerCase();
        for (const ar of autoResponders) {
          if (content.includes(ar.trigger)) {
            message.channel.send(ar.response).catch(() => {});
            break; // Only trigger one auto-responder per message
          }
        }
      }
    }

    // Get server-specific prefix or use default
    let prefix = defaultPrefix;
    if (message.guild) {
      const settings = db.get('guild_settings', message.guild.id) || {};
      prefix = settings.prefix || defaultPrefix;
    }

    // Check if message starts with prefix
    if (!message.content.startsWith(prefix)) return;

    // Parse command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Get command from collection (check aliases too)
    let command = message.client.commands.get(commandName);

    if (!command) {
      // Check if it's an alias
      command = message.client.commands.find(
        cmd => cmd.aliases && cmd.aliases.includes(commandName)
      );
    }

    if (!command) return;

    // Check if command is guild-only
    if (command.guildOnly && !message.guild) {
      return message.reply('❌ This command can only be used in a server!');
    }

    // Check if command is owner-only
    if (command.ownerOnly) {
      const ownerResult = ownerCheck.canExecute(message);
      if (!ownerResult.canExecute) {
        return message.reply(ownerResult.reason);
      }
    }

    // Check cooldown (database-backed)
    const cooldownTime = command.cooldown || 3; // Default 3 seconds
    const cooldownKey = `${message.author.id}-${command.name}`;
    const cooldownData = db.get('cooldowns', cooldownKey);
    
    if (cooldownData && Date.now() < cooldownData) {
      const timeLeft = Math.ceil((cooldownData - Date.now()) / 1000);
      return message.reply(
        `⏱️ Please wait ${timeLeft} second${timeLeft !== 1 ? 's' : ''} before using \`${command.name}\` again.`
      );
    }

    // Execute command
    try {
      await command.execute(message, args);

      // Set cooldown in database
      db.set('cooldowns', cooldownKey, Date.now() + (cooldownTime * 1000));

      logger.info(
        `Command executed: ${command.name} | User: ${message.author.tag} | Guild: ${message.guild?.name || 'DM'}`
      );
    } catch (error) {
      logger.error(`Error executing command ${command.name}:`, {
        error: error.message,
        user: message.author.tag,
        guild: message.guild?.name,
      });
      message.reply(
        '❌ There was an error executing that command! Please try again later.'
      );
    }
  },
};
