const logger = require('../utils/logger');
const db = require('../utils/database');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots, DMs, and messages without content
    if (message.author.bot || !message.guild || !message.content) return;

    try {
      const settings = db.get('guild_settings', message.guild.id) || {};

      // Check word filter
      const wordFilter = settings.wordFilter || [];
      if (wordFilter.length > 0) {
        const content = message.content.toLowerCase();

        for (const word of wordFilter) {
          if (content.includes(word)) {
            // Delete message
            await message.delete().catch(() => {});

            // Send warning
            const warning = await message.channel.send(
              `⚠️ ${message.author}, your message contained a filtered word and was deleted.`
            );

            setTimeout(() => warning.delete().catch(() => {}), 5000);

            // Log to server logs
            if (settings.logsChannel) {
              const logsChannel = message.guild.channels.cache.get(
                settings.logsChannel
              );
              if (logsChannel) {
                logsChannel
                  .send(
                    `🚫 **Word Filter**\nUser: ${message.author.tag} (${message.author.id})\nChannel: ${message.channel}\nFiltered word: \`${word}\`\nMessage: ${message.content.substring(0, 100)}`
                  )
                  .catch(() => {});
              }
            }

            logger.warn(
              `Word filter triggered: ${message.author.tag} in ${message.guild.name}`
            );
            return;
          }
        }
      }

      // Check regex filters
      const regexFilters = settings.regexFilters || [];
      if (regexFilters.length > 0) {
        for (const filter of regexFilters) {
          try {
            const regex = new RegExp(filter.pattern, filter.flags || 'gi');

            if (regex.test(message.content)) {
              // Delete message
              await message.delete().catch(() => {});

              // Send warning
              const warning = await message.channel.send(
                `⚠️ ${message.author}, your message matched a filter pattern (${filter.name}) and was deleted.`
              );

              setTimeout(() => warning.delete().catch(() => {}), 5000);

              // Log to server logs
              if (settings.logsChannel) {
                const logsChannel = message.guild.channels.cache.get(
                  settings.logsChannel
                );
                if (logsChannel) {
                  logsChannel
                    .send(
                      `🚫 **Regex Filter**\nUser: ${message.author.tag} (${message.author.id})\nChannel: ${message.channel}\nFilter: ${filter.name}\nPattern: \`${filter.pattern}\`\nMessage: ${message.content.substring(0, 100)}`
                    )
                    .catch(() => {});
                }
              }

              logger.warn(
                `Regex filter triggered (${filter.name}): ${message.author.tag} in ${message.guild.name}`
              );
              return;
            }
          } catch (error) {
            logger.error(`Error in regex filter ${filter.name}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error in word filter event:', error);
    }
  },
};
