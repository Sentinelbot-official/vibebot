const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'terms',
  aliases: ['tos'],
  description: "View the bot's terms of service",
  category: 'general',
  cooldown: 5,
  execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('📜 Terms of Service')
      .setDescription('By using this bot, you agree to the following terms:')
      .addFields(
        {
          name: '✅ You Agree To',
          value:
            "• Follow Discord's TOS\n" +
            '• Use the bot responsibly\n' +
            '• Not abuse or exploit features\n' +
            '• Respect other users',
          inline: false,
        },
        {
          name: '🚫 Prohibited Uses',
          value:
            '• Spamming or flooding\n' +
            '• Harassment or abuse\n' +
            '• Exploiting bugs\n' +
            '• Illegal activities',
          inline: false,
        },
        {
          name: '⚠️ Disclaimer',
          value:
            '• Bot provided "as is"\n' +
            '• No uptime guarantees\n' +
            '• Virtual currency has no real value\n' +
            '• We reserve the right to modify/terminate service',
          inline: false,
        },
        {
          name: '📄 Full Terms',
          value:
            '[Read Full Terms of Service](https://github.com/Sentinelbot-official/vibebot/blob/main/TERMS_OF_SERVICE.md)',
          inline: false,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
