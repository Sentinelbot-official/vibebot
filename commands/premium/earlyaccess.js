const { EmbedBuilder } = require('discord.js');
const earlyAccess = require('../../utils/earlyAccess');
const premium = require('../../utils/premium');

module.exports = {
  name: 'earlyaccess',
  description: 'View early access features available to Premium/VIP users',
  usage: '//earlyaccess',
  aliases: ['beta', 'earlybeta'],
  category: 'premium',
  cooldown: 10,
  async execute(message, args) {
    const premiumData = premium.getServerPremium(message.guild.id);
    const allFeatures = earlyAccess.getAllFeatures();
    const availableFeatures = earlyAccess.getAvailableFeatures(
      message.guild.id
    );

    const embed = new EmbedBuilder()
      .setColor(premiumData ? '#00ff00' : '#0099ff')
      .setTitle('🧪 Early Access Features')
      .setDescription(
        'Premium and VIP users get early access to new features before public release!\n\n' +
          (premiumData
            ? `**Your Tier:** ${premiumData.tier.toUpperCase()} 💎`
            : '**Your Tier:** Free (Upgrade for early access!)')
      )
      .setTimestamp();

    // Show available features
    if (availableFeatures.length > 0) {
      let availableText = '';
      for (const feature of availableFeatures) {
        const tierBadge = feature.minTier === 'vip' ? '👑' : '💎';
        availableText += `${tierBadge} **${feature.name}**\n${feature.description}\n\n`;
      }
      embed.addFields({
        name: '✅ Available to You',
        value: availableText,
        inline: false,
      });
    }

    // Show locked features
    const lockedFeatures = Object.entries(allFeatures).filter(([key]) => {
      const access = earlyAccess.hasEarlyAccess(message.guild.id, key);
      return !access.hasAccess;
    });

    if (lockedFeatures.length > 0) {
      let lockedText = '';
      for (const [key, feature] of lockedFeatures) {
        const tierBadge = feature.minTier === 'vip' ? '👑 VIP' : '💎 Premium';
        const releaseDate = new Date(feature.releaseDate).toLocaleDateString();
        lockedText += `🔒 **${feature.name}** (${tierBadge})\n${feature.description}\nPublic Release: ${releaseDate}\n\n`;
      }
      embed.addFields({
        name: '🔒 Requires Premium/VIP',
        value: lockedText,
        inline: false,
      });
    }

    // Add CTA if not premium
    if (!premiumData) {
      embed.addFields({
        name: '💎 Get Early Access',
        value:
          'Upgrade to Premium or VIP to access these features now!\n\n' +
          '**Premium** - $5/month\n' +
          '**VIP** - $10/month\n\n' +
          'Use `//premium` to learn more!',
        inline: false,
      });
    }

    embed.setFooter({
      text: 'Early access features are tested live on stream! 🔴',
    });

    return message.reply({ embeds: [embed] });
  },
};
