const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');

module.exports = {
  name: 'premium',
  description: 'Check the premium status of this server',
  usage: '//premium',
  category: 'general',
  cooldown: 5,
  async execute(message) {
    const premiumData = premium.getServerPremium(message.guild.id);

    if (!premiumData) {
      // Free tier
      const embed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('🆓 Free Tier')
        .setDescription(
          `This server is currently on the **Free** tier.\n\n` +
            `**Want to unlock more features?**\n` +
            `Upgrade to Premium or VIP!\n\n` +
            `💎 **Premium** - $5/month\n` +
            `👑 **VIP** - $10/month\n\n` +
            `🔗 Get your activation key at:\n` +
            `https://ko-fi.com/airis0`
        )
        .addFields(
          {
            name: '✅ Current Features',
            value:
              '• 200+ Commands\n' +
              '• All Core Features\n' +
              '• Community Support\n' +
              '• Regular Updates',
            inline: true,
          },
          {
            name: '✨ Unlock with Premium',
            value:
              '• Priority Support\n' +
              '• Custom Bot Status\n' +
              '• Premium Badge\n' +
              '• Exclusive Commands',
            inline: true,
          }
        )
        .setFooter({
          text: 'Use //activate <key> to upgrade',
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Has premium/VIP
    const tierEmoji = premiumData.tier === 'vip' ? '👑' : '✨';
    const tierColor = premiumData.tier === 'vip' ? '#ff0000' : '#0099ff';
    const tierName = premiumData.tier.toUpperCase();

    const embed = new EmbedBuilder()
      .setColor(tierColor)
      .setTitle(`${tierEmoji} ${tierName} Server`)
      .setDescription(
        `This server has **${tierName}** access!\n\n` +
          `Thank you for supporting the 24/7 live coding journey! 💜`
      )
      .addFields(
        {
          name: '📅 Activated',
          value: `<t:${Math.floor(premiumData.activatedAt / 1000)}:R>`,
          inline: true,
        },
        {
          name: '⏰ Expires',
          value:
            premiumData.expiresAt > 0
              ? `<t:${Math.floor(premiumData.expiresAt / 1000)}:R>`
              : '♾️ Never',
          inline: true,
        },
        {
          name: '🔑 Activated By',
          value: `<@${premiumData.activatedBy}>`,
          inline: true,
        }
      )
      .setFooter({
        text: `Activation Key: ${premiumData.activationKey}`,
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
