const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'dashboard',
  aliases: ['webpanel', 'web'],
  description: 'Access the web dashboard',
  usage: '',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🌐 Web Dashboard')
      .setDescription(
        '**Manage your server from the web!**\n\n' +
          '**Features:**\n' +
          '• 📊 Live server statistics\n' +
          '• ⚙️ Configure bot settings\n' +
          '• 📈 View analytics & insights\n' +
          '• 👥 Manage members\n' +
          '• 🎨 Custom branding\n\n' +
          '**Access Dashboard:**\n' +
          '🔗 [dashboard.vibebot.com](https://dashboard.vibebot.com)\n\n' +
          '**Login:**\n' +
          '1. Click "Login with Discord"\n' +
          '2. Authorize the bot\n' +
          '3. Select your server\n' +
          '4. Start managing!\n\n' +
          '**Premium Features:**\n' +
          '• Advanced analytics\n' +
          '• Custom themes\n' +
          '• API access\n' +
          '• Priority support'
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
