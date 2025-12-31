const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'twitch',
  description: 'Get Twitch stream info (requires API key)',
  usage: '<username>',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Provide a Twitch username!\nUsage: `twitch <username>`'
      );
    }

    const apiKey = process.env.TWITCH_CLIENT_ID;

    if (!apiKey) {
      return message.reply(
        '❌ Twitch integration not configured. Add `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` to .env'
      );
    }

    return message.reply(
      '📺 Twitch integration configured but not implemented. Add twitch API library and implement stream checking here.'
    );
  },
};
