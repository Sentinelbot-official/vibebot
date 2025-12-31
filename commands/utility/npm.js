const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'npm',
  aliases: ['package', 'npmjs'],
  description: 'Get NPM package information (placeholder - requires API)',
  usage: '<package>',
  category: 'utility',
  cooldown: 10,
  execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a package name! (e.g., `discord.js`)'
      );
    }

    const packageName = args[0];

    // This is a placeholder - you would integrate with NPM API

    const embed = new EmbedBuilder()
      .setColor(0xcb3837)
      .setTitle(`📦 NPM: ${packageName}`)
      .setDescription(
        '⚠️ **NPM API Not Configured**\n\n' +
          'To use this command, you need to:\n' +
          '1. Use NPM Registry API (no key needed!)\n' +
          '2. Fetch from: `https://registry.npmjs.org/${packageName}`\n' +
          '3. Update this command with API integration'
      )
      .addFields(
        {
          name: 'Features to Add',
          value:
            '• Package version\n• Weekly downloads\n• Description\n• Author info\n• Dependencies count\n• Last publish date',
          inline: false,
        },
        {
          name: 'API Endpoint',
          value: '`https://registry.npmjs.org/<package>`',
          inline: false,
        }
      );

    message.reply({ embeds: [embed] });
  },
};
