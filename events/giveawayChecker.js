const { Events } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: Events.ClientReady,
  once: false,
  execute(client) {
    // Check for ended giveaways every minute
    setInterval(async () => {
      try {
        const allGuilds = client.guilds.cache.map(g => g.id);

        for (const guildId of allGuilds) {
          const giveaways = db.get('giveaways', guildId) || {};

          for (const [messageId, giveaway] of Object.entries(giveaways)) {
            if (giveaway.ended) continue;
            if (Date.now() < giveaway.endTime) continue;

            // Giveaway has ended, process it
            const { endGiveaway } = require('../commands/fun/giveaway');
            await endGiveaway(client, giveaway);
          }
        }
      } catch (error) {
        const logger = require('../utils/logger');
        logger.error('Giveaway checker error:', error);
      }
    }, 60000); // Check every minute
  },
};
