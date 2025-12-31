const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'daily',
  description: 'Claim your daily coins',
  category: 'economy',
  cooldown: 5,
  async execute(message, _args) {
    const userId = message.author.id;

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

    const embed = new EmbedBuilder()
      .setColor(milestoneBonus > 0 ? 0xffd700 : isWeekend ? 0xff69b4 : 0x00ff00)
      .setTitle(`💰 Daily Reward Claimed!${milestoneBonus > 0 ? ' 🎊' : ''}`)
      .setDescription(
        `You received **${totalReward.toLocaleString()} coins**!${milestoneText}`
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
      .setFooter({
        text: `Next milestone: ${milestones.find(m => m > economy.dailyStreak) || 'MAX'} days | Come back tomorrow!`,
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
