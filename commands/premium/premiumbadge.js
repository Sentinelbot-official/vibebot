const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');
const db = require('../../utils/database');

module.exports = {
  name: 'premiumbadge',
  description: 'Claim your Premium or VIP badge (Premium only)',
  usage: '//premiumbadge',
  aliases: ['badge', 'claimbadge'],
  category: 'premium',
  cooldown: 10,
  async execute(message, args) {
    // Check if server has premium
    const premiumData = premium.getServerPremium(message.guild.id);

    if (!premiumData) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Premium Required')
        .setDescription(
          'This server does not have Premium or VIP!\n\n' +
            'Use `//premium` to learn more or visit:\n' +
            'https://sentinelbot-official.github.io/vibebot/activate.html'
        );

      return message.reply({ embeds: [embed] });
    }

    // Get or create premium badge role
    const tier = premiumData.tier;
    const roleName = tier === 'vip' ? '👑 VIP Supporter' : '💎 Premium Supporter';
    const roleColor = tier === 'vip' ? '#ff0000' : '#0099ff';

    try {
      // Find existing role
      let badgeRole = message.guild.roles.cache.find(
        role => role.name === roleName
      );

      // Create role if it doesn't exist
      if (!badgeRole) {
        badgeRole = await message.guild.roles.create({
          name: roleName,
          color: roleColor,
          reason: `${tier.toUpperCase()} badge role created by Vibe Bot`,
          permissions: [],
        });
      }

      // Check if user already has the role
      if (message.member.roles.cache.has(badgeRole.id)) {
        return message.reply(
          `✅ You already have the ${roleName} badge!`
        );
      }

      // Add role to user
      await message.member.roles.add(badgeRole);

      // Save badge claim
      const userBadges = db.get('user_badges', message.author.id) || {
        badges: [],
      };
      if (!userBadges.badges.includes(tier)) {
        userBadges.badges.push(tier);
        userBadges.claimedAt = Date.now();
        db.set('user_badges', message.author.id, userBadges);
      }

      const embed = new EmbedBuilder()
        .setColor(roleColor)
        .setTitle(`✅ ${tier === 'vip' ? '👑' : '💎'} Badge Claimed!`)
        .setDescription(
          `You now have the **${roleName}** badge!\n\n` +
            'Thank you for supporting Vibe Bot! 💜\n\n' +
            '**Your Badge Benefits:**\n' +
            `• Exclusive ${tier.toUpperCase()} role\n` +
            '• Show your support to the community\n' +
            '• Access to premium features\n' +
            (tier === 'vip' ? '• VIP-only perks and commands' : '')
        )
        .setFooter({ text: 'Thank you for supporting the 24/7 journey!' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating/assigning badge role:', error);
      return message.reply(
        '❌ Failed to assign badge role. Make sure the bot has **Manage Roles** permission and is higher than the badge role in the role hierarchy!'
      );
    }
  },
};
