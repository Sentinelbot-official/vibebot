const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'deletemydata',
  description: 'Request deletion of your personal data (GDPR/CCPA compliance)',
  usage: '//deletemydata confirm',
  aliases: ['gdpr', 'deleteme', 'forgetme'],
  category: 'utility',
  cooldown: 86400, // 24 hours

  async execute(message, args) {
    // Show information if no confirmation
    if (!args[0] || args[0].toLowerCase() !== 'confirm') {
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('⚠️ Data Deletion Request')
        .setDescription(
          '**This will permanently delete ALL your data from Vibe Bot!**\n\n' +
            '**What will be deleted:**\n' +
            '• Economy data (coins, bank, items, transactions)\n' +
            '• Leveling data (XP, level, rank)\n' +
            '• Social data (profile, marriage, reputation)\n' +
            '• Modmail history\n' +
            '• AFK status\n' +
            '• All other personal data\n\n' +
            '**What will NOT be deleted:**\n' +
            '• Server moderation logs (kept for server safety)\n' +
            '• Server settings (not personal data)\n\n' +
            '**This action cannot be undone!**\n\n' +
            '**To confirm deletion, type:**\n' +
            '`//deletemydata confirm`'
        )
        .addFields(
          {
            name: '📄 Your Rights',
            value:
              'Under GDPR and CCPA, you have the right to:\n' +
              '• Request data deletion\n' +
              '• Request a copy of your data\n' +
              '• Opt-out of data collection',
          },
          {
            name: '📧 Alternative',
            value:
              'You can also email us at vibetbot0@proton.me\n' +
              'for manual data deletion or data export.',
          }
        )
        .setFooter({
          text: 'We respect your privacy | See //privacy for details',
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // User confirmed - proceed with deletion
    const userId = message.author.id;

    try {
      // Delete user data from all collections
      const collectionsToDelete = [
        'economy',
        'leveling',
        'profile',
        'marriage',
        'reputation',
        'afk',
        'inventory',
        'achievements',
        'daily_streak',
        'user_badges',
        'clan_members',
        'pet',
        'birthday',
      ];

      let deletedCount = 0;
      for (const collection of collectionsToDelete) {
        const exists = db.get(collection, userId);
        if (exists) {
          db.delete(collection, userId);
          deletedCount++;
        }
      }

      // Delete modmail sessions
      db.delete('modmail_sessions', userId);

      // Note: We keep moderation logs for server safety (as stated in privacy policy)
      // Server admins need these for audit trails

      const confirmEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Data Deleted Successfully')
        .setDescription(
          `Your personal data has been permanently deleted from Vibe Bot.\n\n` +
            `**Deleted:**\n` +
            `• ${deletedCount} data collection(s) removed\n` +
            `• All personal information erased\n` +
            `• Modmail sessions cleared\n\n` +
            `**Note:** Server moderation logs are retained for server safety as per our Privacy Policy.\n\n` +
            `**What happens now:**\n` +
            `• Your economy balance is reset to 0\n` +
            `• Your level/XP is reset to 0\n` +
            `• Your profile is cleared\n` +
            `• You can start fresh if you use the bot again\n\n` +
            `Thank you for using Vibe Bot! 💜`
        )
        .addFields({
          name: '📧 Still Have Questions?',
          value:
            'Contact us at vibetbot0@proton.me\n' +
            'Join our support server: https://discord.gg/zFMgG6ZN68',
        })
        .setFooter({
          text: 'Data deletion completed | ' + new Date().toLocaleString(),
        })
        .setTimestamp();

      await message.reply({ embeds: [confirmEmbed] });

      // Log the deletion
      const logger = require('../../utils/logger');
      const branding = require('../../utils/branding');
      logger.info(
        `[GDPR] User ${message.author.tag} (${userId}) requested data deletion`
      );
    } catch (error) {
      console.error('Error deleting user data:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Deletion Failed')
        .setDescription(
          'An error occurred while deleting your data.\n\n' +
            'Please contact us directly:\n' +
            '**Email:** vibetbot0@proton.me\n' +
            '**Support Server:** https://discord.gg/zFMgG6ZN68\n\n' +
            'We will manually process your deletion request.'
        );

      return message.reply({ embeds: [errorEmbed] });
    }
  },
};
