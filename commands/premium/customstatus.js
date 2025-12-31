const { EmbedBuilder, ActivityType } = require('discord.js');
const premium = require('../../utils/premium');
const db = require('../../utils/database');

module.exports = {
  name: 'customstatus',
  description: 'Set a custom bot status for your server (Premium only)',
  usage: '//customstatus <status text>',
  aliases: ['setstatus', 'botstatus'],
  category: 'premium',
  cooldown: 60,
  async execute(message, args) {
    // Check if server has premium
    if (!premium.hasPremium(message.guild.id)) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Premium Required')
        .setDescription(
          'This feature requires **Premium** or **VIP**!\n\n' +
            '**Premium Benefits:**\n' +
            '• Custom bot status\n' +
            '• Premium badge\n' +
            '• Early feature access\n' +
            '• Exclusive commands\n' +
            '• And more!\n\n' +
            'Use `//premium` to learn more or visit:\n' +
            'https://sentinelbot-official.github.io/vibebot/activate.html'
        )
        .setFooter({ text: 'Support the 24/7 live coding journey! 💜' });

      return message.reply({ embeds: [embed] });
    }

    // Check if user has Manage Server permission
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply(
        '❌ You need the **Manage Server** permission to change the bot status!'
      );
    }

    // Check if status text provided
    if (!args.length) {
      const currentStatus = db.get('custom_status', message.guild.id);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎨 Custom Bot Status')
        .setDescription(
          'Set a custom status for the bot in your server!\n\n' +
            '**Usage:**\n' +
            '`//customstatus <text>` - Set custom status\n' +
            '`//customstatus reset` - Reset to default\n\n' +
            '**Current Status:**\n' +
            (currentStatus?.status || 'Default (rotating statuses)')
        )
        .setFooter({ text: 'Premium Feature 💎' });

      return message.reply({ embeds: [embed] });
    }

    const statusText = args.join(' ');

    // Reset to default
    if (statusText.toLowerCase() === 'reset') {
      db.delete('custom_status', message.guild.id);

      return message.reply(
        '✅ Bot status reset to default! The bot will use rotating statuses.'
      );
    }

    // Validate length
    if (statusText.length > 128) {
      return message.reply('❌ Status text must be 128 characters or less!');
    }

    // Save custom status
    db.set('custom_status', message.guild.id, {
      status: statusText,
      setBy: message.author.id,
      setAt: Date.now(),
    });

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Custom Status Set!')
      .setDescription(
        `**New Status:**\n${statusText}\n\n` +
          "**Note:** The bot's status will update within a few minutes.\n" +
          'The custom status is only visible in this server.'
      )
      .setFooter({ text: 'Premium Feature 💎' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
