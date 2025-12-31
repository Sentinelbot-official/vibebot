const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');
const branding = require('../../utils/branding');

module.exports = {
  name: 'daily',
  description: 'Claim your daily coins (Premium users get 2-3x rewards!)',
  category: 'economy',
  cooldown: 5,
  async execute(message, _args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Get user economy data
    const economy = db.get('economy', userId) || {
      coins: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0,
      dailyStreak: 0,
    };

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const timeSinceDaily = now - economy.lastDaily;

    // Check if already claimed today
    if (timeSinceDaily < oneDay) {
      const timeLeft = oneDay - timeSinceDaily;
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

      return message.reply(
        `⏱️ You've already claimed your daily reward! Come back in **${hours}h ${minutes}m**`
      );
    }

    // Check streak
    const twoDays = 2 * oneDay;
    if (timeSinceDaily < twoDays) {
      economy.dailyStreak = (economy.dailyStreak || 0) + 1;
    } else {
      economy.dailyStreak = 1;
    }

    // Advanced reward calculation with multiple bonuses
    const baseReward = 500;
    const streakBonus = Math.min(economy.dailyStreak * 50, 1000); // Max 1000 bonus

    // Level bonus (if leveling system exists)
    const leveling = db.get('leveling', userId) || { level: 1 };
    const levelBonus = leveling.level * 10;

    // Random bonus (10-30%)
    const randomMultiplier = 1 + (Math.random() * 0.2 + 0.1);

    // Weekend bonus (50% more on weekends)
    const isWeekend = [0, 6].includes(new Date().getDay());
    const weekendBonus = isWeekend ? 250 : 0;

    // Calculate total with all bonuses
    let totalReward =
      Math.floor((baseReward + streakBonus + levelBonus) * randomMultiplier) +
      weekendBonus;

    // Apply premium multiplier
    const premiumMultiplier = premiumPerks.getMultiplier(guildId, 'daily');
    const premiumBonus =
      premiumMultiplier > 1
        ? Math.floor(totalReward * (premiumMultiplier - 1))
        : 0;
    totalReward = premiumPerks.applyDailyMultiplier(guildId, totalReward);

    // Milestone rewards
    const milestones = [7, 30, 100, 365];
    let milestoneBonus = 0;
    let milestoneText = '';

    if (milestones.includes(economy.dailyStreak)) {
      milestoneBonus = economy.dailyStreak * 100;
      totalReward += milestoneBonus;
      milestoneText = `\n🎊 **MILESTONE BONUS!** +${milestoneBonus.toLocaleString()} coins for ${economy.dailyStreak} day streak!`;
    }

    economy.coins += totalReward;
    economy.lastDaily = now;
    economy.totalEarned = (economy.totalEarned || 0) + totalReward;

    db.set('economy', userId, economy);

    const tierBadge = premiumPerks.getTierBadge(guildId);
    const tierName = premiumPerks.getTierDisplayName(guildId);

    const embed = new EmbedBuilder()
      .setColor(milestoneBonus > 0 ? 0xffd700 : isWeekend ? 0xff69b4 : 0x00ff00)
      .setTitle(
        `${tierBadge} Daily Reward Claimed!${milestoneBonus > 0 ? ' 🎊' : ''}`
      )
      .setDescription(
        `You received **${totalReward.toLocaleString()} coins**!${milestoneText}${
          premiumBonus > 0
            ? `\n\n${tierBadge} **${tierName} Bonus:** +${premiumBonus.toLocaleString()} coins (${premiumMultiplier}x multiplier)`
            : ''
        }`
      )
      .addFields(
        {
          name: '🔥 Streak',
          value: `${economy.dailyStreak} day${economy.dailyStreak !== 1 ? 's' : ''}`,
          inline: true,
        },
        {
          name: '🎁 Streak Bonus',
          value: `+${streakBonus.toLocaleString()}`,
          inline: true,
        },
        {
          name: '⭐ Level Bonus',
          value: `+${levelBonus.toLocaleString()}`,
          inline: true,
        },
        {
          name: '🎲 Lucky Bonus',
          value: `×${randomMultiplier.toFixed(2)}`,
          inline: true,
        },
        {
          name: isWeekend ? '🎉 Weekend Bonus' : '📅 Day',
          value: isWeekend
            ? `+${weekendBonus}`
            : new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          inline: true,
        },
        {
          name: '💰 New Balance',
          value: `${economy.coins.toLocaleString()} coins`,
          inline: true,
        }
      )
      .setFooter(branding.footers.community)
      .setTimestamp()
      .setAuthor({
        name:
          economy.dailyStreak >= 7
            ? "🔥 You're on fire! Keep it up!"
            : branding.getTagline(),
        iconURL: branding.footers.default.iconURL,
      });

    message.reply({ embeds: [embed] });
  },
};
