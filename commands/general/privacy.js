const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'privacy',
  description: "View the bot's privacy policy",
  category: 'general',
  cooldown: 5,
  execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🔒 Privacy Policy')
      .setDescription(
        "We take your privacy seriously. Here's what you need to know:"
      )
      .addFields(
        {
          name: '📊 What We Collect',
          value:
            '• User IDs (for features)\n' +
            '• Server IDs (for settings)\n' +
            '• Economy & leveling data\n' +
            '• Moderation records',
          inline: false,
        },
        {
          name: "🔐 What We DON'T Collect",
          value:
            '• Message content (except temp for auto-mod)\n' +
            '• Personal information\n' +
            "• We DON'T sell your data",
          inline: false,
        },
        {
          name: '🗑️ Your Rights',
          value:
            '• Request data deletion\n' +
            '• Access your data\n' +
            '• GDPR & CCPA compliant',
          inline: false,
        },
        {
          name: '📄 Full Policy',
          value: '[Read Full Privacy Policy](https://github.com/Sentinelbot-official/vibebot/blob/main/PRIVACY_POLICY.md)',
          inline: false,
        }
      )
      .setFooter({ text: 'Last Updated: December 31, 2025' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
