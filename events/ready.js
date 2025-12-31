const logger = require('../utils/logger');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);
    logger.info(`Loaded ${client.commands.size} commands`);
  },
};
