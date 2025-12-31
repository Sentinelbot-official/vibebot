const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'shorten',
  aliases: ['shorturl', 'tinyurl'],
  description: 'Shorten a URL (placeholder - requires API)',
  usage: '<url>',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Please provide a URL to shorten!');
    }

    const url = args[0];

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return message.reply('❌ Please provide a valid URL!');
    }

    // This is a placeholder - you would integrate with a URL shortener API

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🔗 URL Shortener')
      .setDescription(
        '⚠️ **URL Shortener API Not Configured**\n\n' +
          'To use this command, you need to:\n' +
          '1. Choose a URL shortener API\n' +
          '2. Add API key to .env\n' +
          '3. Update this command with API integration'
      )
      .addFields(
        { name: 'Original URL', value: url.substring(0, 1024), inline: false },
        {
          name: 'Recommended APIs',
          value:
            '• [Bitly API](https://dev.bitly.com/)\n• [TinyURL API](https://tinyurl.com/app/dev)\n• [Rebrandly](https://www.rebrandly.com/api)\n• [Is.gd](https://is.gd/developers.php) (No API key needed)',
          inline: false,
        }
      );

    message.reply({ embeds: [embed] });
  },
};
