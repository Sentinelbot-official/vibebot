const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');

module.exports = {
  name: 'activate',
  description:
    'Activate Premium or VIP for this server using an activation key',
  usage: '//activate <key>',
  category: 'general',
  cooldown: 10,
  async execute(message, args) {
    // Check if user has Manage Server permission
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply(
        '❌ You need the **Manage Server** permission to activate premium!\n\n' +
          '**Why?** Premium activation affects the entire server, so only server administrators can activate it.\n' +
          '**Solution:** Ask a server administrator or owner to run this command.'
      );
    }

    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔑 Premium Activation')
        .setDescription(
          'Activate Premium or VIP features for this server!\n\n' +
            '**How to get a key:**\n' +
            '💎 Purchase Premium ($5/month) or VIP ($10/month) at:\n' +
            '🔗 https://ko-fi.com/airis0\n\n' +
            '**Usage:**\n' +
            '`//activate <your-key>`\n\n' +
            '**Example:**\n' +
            '`//activate VIBE-PREMIUM-ABC123DEF456`'
        )
        .addFields(
          {
            name: '✨ Premium Benefits',
            value:
              '• Priority Support\n' +
              '• Custom Bot Status\n' +
              '• Premium Badge\n' +
              '• Early Feature Access\n' +
              '• Exclusive Commands',
            inline: true,
          },
          {
            name: '👑 VIP Benefits',
            value:
              '• Everything in Premium\n' +
              '• VIP Role & Badge\n' +
              '• Custom Commands\n' +
              '• Feature Request Priority\n' +
              '• Name in Credits',
            inline: true,
          }
        )
        .setFooter({
          text: 'Support the 24/7 live coding journey! 💜',
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const key = args[0].toUpperCase();

    // Show loading message
    const loadingMsg = await message.reply('🔄 Validating activation key...');

    // Activate the key
    const result = premium.activateKey(
      message.guild.id,
      key,
      message.author.id
    );

    if (!result.success) {
      return loadingMsg.edit(result.message);
    }

    // Success!
    const tierEmoji = result.tier === 'vip' ? '👑' : '✨';
    const tierColor = result.tier === 'vip' ? '#ff0000' : '#0099ff';

    const successEmbed = new EmbedBuilder()
      .setColor(tierColor)
      .setTitle(`${tierEmoji} ${result.tier.toUpperCase()} Activated!`)
      .setDescription(
        `**Congratulations!** This server now has ${result.tier.toUpperCase()} access!\n\n` +
          `🎉 All ${result.tier} features are now unlocked!`
      )
      .addFields(
        {
          name: '📅 Duration',
          value:
            result.duration > 0 ? `${result.duration} days` : '♾️ Lifetime',
          inline: true,
        },
        {
          name: '⏰ Expires',
          value:
            result.expiresAt > 0
              ? `<t:${Math.floor(result.expiresAt / 1000)}:R>`
              : 'Never',
          inline: true,
        },
        {
          name: '🔑 Activated By',
          value: `<@${message.author.id}>`,
          inline: true,
        }
      )
      .setFooter({
        text: 'Thank you for supporting Vibe Bot! 💜',
      })
      .setTimestamp();

    await loadingMsg.edit({ content: null, embeds: [successEmbed] });

    // Log activation
    const logger = require('../../utils/logger');
    const branding = require('../../utils/branding');
    logger.success(
      `[PREMIUM] ${result.tier.toUpperCase()} activated for ${message.guild.name} (${message.guild.id}) by ${message.author.tag}`
    );
  },
};
