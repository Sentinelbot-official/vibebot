const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'github',
  aliases: ['gh', 'repo'],
  description: 'Get GitHub repository information (placeholder - requires API)',
  usage: '<user/repo>',
  category: 'utility',
  cooldown: 10,
  execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a repository! (e.g., `discordjs/discord.js`)'
      );
    }

    const repo = args[0];

    // This is a placeholder - you would integrate with GitHub API

    const embed = new EmbedBuilder()
      .setColor(0x238636)
      .setTitle(`📦 GitHub: ${repo}`)
      .setDescription(
        '⚠️ **GitHub API Not Configured**\n\n' +
          'To use this command, you need to:\n' +
          '1. Create a GitHub Personal Access Token\n' +
          '2. Add `GITHUB_TOKEN=your_token` to .env\n' +
          '3. Update this command with API integration'
      )
      .addFields(
        {
          name: 'Features to Add',
          value:
            '• Repository stats (stars, forks, issues)\n• Latest release info\n• Contributors count\n• Language breakdown\n• License info',
          inline: false,
        },
        {
          name: 'API Docs',
          value: '[GitHub REST API](https://docs.github.com/en/rest)',
          inline: false,
        }
      );

    message.reply({ embeds: [embed] });
  },
};
