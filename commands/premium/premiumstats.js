const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');
const premiumPerks = require('../../utils/premiumPerks');

module.exports = {
  name: 'premiumstats',
  description: 'View your premium status and perks',
  usage: '//premiumstats',
  aliases: ['pstats', 'premiuminfo'],
  category: 'premium',
  cooldown: 5,
  async execute(message, args) {
    const guildId = message.guild.id;
    const premiumData = premium.getServerPremium(guildId);
    const perksSummary = premiumPerks.getPerksSummary(guildId);

    const embed = new EmbedBuilder()
      .setColor(premiumData ? '#00ff00' : '#ff0000')
      .setTitle(`${perksSummary.badge} Premium Status`)
      .setTimestamp();

    if (!premiumData) {
      embed
        .setDescription(
          '**This server does not have Premium or VIP!**\n\n' +
            '**Upgrade to unlock amazing perks:**\n' +
            '💎 **Premium** - $5/month\n' +
            '👑 **VIP** - $10/month\n\n' +
            'Use `//premium` to learn more!'
        )
        .addFields(
          {
            name: '💎 Premium Benefits',
            value:
              '• 2x daily rewards\n' +
              '• 1.5x economy earnings\n' +
              '• 50% faster cooldowns\n' +
              '• 10% shop discount\n' +
              '• 50 AI images/day\n' +
              '• Custom bot status\n' +
              '• Premium badge\n' +
              '• Early access features',
            inline: true,
          },
          {
            name: '👑 VIP Benefits',
            value:
              '• 3x daily rewards\n' +
              '• 2x economy earnings\n' +
              '• 75% faster cooldowns\n' +
              '• 25% shop discount\n' +
              '• Unlimited AI images\n' +
              '• Custom commands\n' +
              '• AI chat bot\n' +
              '• All Premium features',
            inline: true,
          }
        );

      return message.reply({ embeds: [embed] });
    }

    // Server has premium!
    const expiresAt = premiumData.expiresAt;
    const isLifetime = expiresAt === 0;
    const daysLeft = isLifetime
      ? 'Lifetime'
      : Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

    embed.setDescription(
      `**This server has ${perksSummary.displayName}!** ${perksSummary.badge}\n\n` +
        `**Activated:** <t:${Math.floor(premiumData.activatedAt / 1000)}:R>\n` +
        `**Expires:** ${isLifetime ? '🎉 Never (Lifetime)' : `<t:${Math.floor(expiresAt / 1000)}:R> (${daysLeft} days)`}\n` +
        `**Activated By:** <@${premiumData.activatedBy}>\n` +
        `**Activation Key:** \`${premiumData.activationKey}\``
    );

    // Show multipliers
    embed.addFields({
      name: '📊 Active Multipliers',
      value:
        `**XP:** ${perksSummary.multipliers.xp}x\n` +
        `**Economy:** ${perksSummary.multipliers.economy}x\n` +
        `**Daily Rewards:** ${perksSummary.multipliers.daily}x\n` +
        `**Cooldowns:** ${Math.round((1 - perksSummary.multipliers.cooldown) * 100)}% faster\n` +
        `**Shop Discount:** ${Math.round(perksSummary.multipliers.shopDiscount * 100)}% off`,
      inline: true,
    });

    // Show limits
    const aiLimit =
      perksSummary.limits.aiImageGenerations === 200
        ? 'Unlimited'
        : perksSummary.limits.aiImageGenerations;

    embed.addFields({
      name: '🎯 Feature Limits',
      value:
        `**AI Images:** ${aiLimit}/day\n` +
        `**Custom Commands:** ${perksSummary.limits.maxCustomCommands}\n` +
        `**Auto Roles:** ${perksSummary.limits.maxAutoRoles}\n` +
        `**Custom Embeds:** ${perksSummary.limits.maxCustomEmbeds}\n` +
        `**Poll Options:** ${perksSummary.limits.maxPollOptions}`,
      inline: true,
    });

    // Show exclusive features
    const featureList = perksSummary.features
      .map(f => {
        const icons = {
          custom_status: '🎨',
          premium_badge: '💎',
          early_access: '🧪',
          advanced_analytics: '📊',
          custom_embeds: '📝',
          priority_support: '⚡',
          reduced_cooldowns: '⏱️',
          economy_bonuses: '💰',
          custom_commands: '🔧',
          ai_chat: '🤖',
          advanced_moderation: '🛡️',
          server_analytics: '📈',
          auto_posting: '📢',
        };
        return icons[f] || '✨';
      })
      .join(' ');

    embed.addFields({
      name: '✨ Exclusive Features',
      value: featureList || 'None',
      inline: false,
    });

    // Add upgrade CTA if Premium (not VIP)
    if (premiumData.tier === 'premium') {
      embed.addFields({
        name: '⬆️ Upgrade to VIP',
        value:
          'Get even more perks with VIP!\n' +
          '• 3x daily rewards (vs 2x)\n' +
          '• Unlimited AI images\n' +
          '• Custom commands builder\n' +
          '• AI chatbot\n\n' +
          'Use `//premium` to upgrade!',
        inline: false,
      });
    }

    embed.setFooter({
      text: `Thank you for supporting Vibe Bot! 💜 | ${perksSummary.displayName} Tier`,
    });

    return message.reply({ embeds: [embed] });
  },
};
