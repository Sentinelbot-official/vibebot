const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premium = require('../../utils/premium');
const branding = require('../../utils/branding');

module.exports = {
  name: 'balance',
  aliases: ['bal', 'coins', 'money', 'wallet'],
  description:
    "Check your balance or another user's balance with detailed statistics",
  usage: '[@user]',
  category: 'economy',
  cooldown: 3,
  async execute(message, _args) {
    const user = message.mentions.users.first() || message.author;

    // Get user economy data
    const economy = db.get('economy', user.id) || {
      coins: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0,
      totalEarned: 0,
      totalSpent: 0,
      dailyStreak: 0,
    };

    const total = economy.coins + economy.bank;
    const netWorth = total;
    const profit = (economy.totalEarned || 0) - (economy.totalSpent || 0);

    // Get premium status
    const tierName = premium.getServerTier(message.guild.id);
    const isPremium = tierName !== 'Free';

    // Calculate bank capacity
    const baseCapacity = 10000;
    const bankCapacity = isPremium ? baseCapacity * 5 : baseCapacity;
    const bankUsage = ((economy.bank / bankCapacity) * 100).toFixed(1);

    // Get leaderboard position
    const allEconomy = db.all('economy');
    const leaderboard = Object.entries(allEconomy)
      .map(([userId, data]) => ({
        userId,
        total: data.coins + data.bank,
      }))
      .sort((a, b) => b.total - a.total);

    const position = leaderboard.findIndex(u => u.userId === user.id) + 1;
    const totalUsers = leaderboard.length;

    // Determine wealth tier
    let wealthTier = '🥉 Bronze';
    if (netWorth >= 1000000) wealthTier = '💎 Diamond';
    else if (netWorth >= 500000) wealthTier = '💍 Platinum';
    else if (netWorth >= 100000) wealthTier = '🥇 Gold';
    else if (netWorth >= 50000) wealthTier = '🥈 Silver';

    // Premium badge
    const premiumBadge = isPremium ? `💎 ${tierName}` : '';

    const embed = new EmbedBuilder()
      .setColor(isPremium ? 0xffd700 : netWorth >= 100000 ? 0xffd700 : 0x00ff00)
      .setAuthor({
        name: `${user.username}'s Balance ${premiumBadge}`,
        iconURL: user.displayAvatarURL(),
      })
      .setThumbnail(user.displayAvatarURL())
      .setDescription(
        `**Wealth Tier:** ${wealthTier}\n` +
          `**Global Rank:** #${position} / ${totalUsers}\n\u200b`
      )
      .addFields(
        {
          name: '💰 Wallet',
          value: `${economy.coins.toLocaleString()} coins\n*Ready to spend*`,
          inline: true,
        },
        {
          name: '🏦 Bank',
          value:
            `${economy.bank.toLocaleString()} / ${bankCapacity.toLocaleString()} coins\n` +
            `*${bankUsage}% full*`,
          inline: true,
        },
        {
          name: '💎 Net Worth',
          value: `${netWorth.toLocaleString()} coins\n*Total wealth*`,
          inline: true,
        },
        {
          name: '📊 Statistics',
          value:
            `**Total Earned:** ${(economy.totalEarned || 0).toLocaleString()}\n` +
            `**Total Spent:** ${(economy.totalSpent || 0).toLocaleString()}\n` +
            `**Profit/Loss:** ${profit >= 0 ? '+' : ''}${profit.toLocaleString()}`,
          inline: true,
        },
        {
          name: '🔥 Daily Streak',
          value:
            `**${economy.dailyStreak || 0}** day${(economy.dailyStreak || 0) !== 1 ? 's' : ''}\n` +
            `${economy.lastDaily ? `Last: <t:${Math.floor(economy.lastDaily / 1000)}:R>` : 'Never claimed'}`,
          inline: true,
        },
        {
          name: '💼 Activity',
          value:
            `**Last Work:** ${economy.lastWork ? `<t:${Math.floor(economy.lastWork / 1000)}:R>` : 'Never'}\n` +
            `**Bank Space:** ${isPremium ? '5x capacity! 💎' : 'Standard'}`,
          inline: true,
        }
      );

    // Add achievement progress
    const achievements = [];
    if (netWorth >= 1000000) achievements.push('💎 Millionaire');
    else if (netWorth >= 500000) achievements.push('💍 Half Million');
    else if (netWorth >= 100000) achievements.push('🥇 100K Club');

    if ((economy.dailyStreak || 0) >= 30) achievements.push('🔥 30 Day Streak');
    else if ((economy.dailyStreak || 0) >= 7)
      achievements.push('🔥 Week Streak');

    if (achievements.length > 0) {
      embed.addFields({
        name: '🏆 Achievements',
        value: achievements.join(' • '),
        inline: false,
      });
    }

    embed.setFooter({
      text: `Requested by ${message.author.tag} | Use //shop to spend coins`,
      iconURL: message.author.displayAvatarURL(),
    });
    embed.setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
