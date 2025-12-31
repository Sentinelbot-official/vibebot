const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');

const jobs = [
  { name: 'programmer', min: 100, max: 300 },
  { name: 'designer', min: 80, max: 250 },
  { name: 'streamer', min: 150, max: 400 },
  { name: 'chef', min: 90, max: 200 },
  { name: 'teacher', min: 70, max: 180 },
  { name: 'doctor', min: 200, max: 500 },
  { name: 'artist', min: 60, max: 220 },
  { name: 'musician', min: 100, max: 350 },
];

module.exports = {
  name: 'work',
  description: 'Work to earn coins (Premium users get 1.5-2x earnings!)',
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
    };

    const now = Date.now();
    const baseCooldown = 60 * 60 * 1000; // 1 hour
    const cooldown = premiumPerks.applyCooldownReduction(guildId, baseCooldown);
    const timeSinceWork = now - economy.lastWork;

    // Check cooldown
    if (timeSinceWork < cooldown) {
      const timeLeft = cooldown - timeSinceWork;
      const minutes = Math.floor(timeLeft / (60 * 1000));

      const tierBadge = premiumPerks.getTierBadge(guildId);
      const cooldownReduction =
        premiumPerks.getMultiplier(guildId, 'cooldown') < 1
          ? ` ${tierBadge} Premium perk active!`
          : '';

      return message.reply(
        `⏱️ You're tired! Rest for **${minutes} minute${minutes !== 1 ? 's' : ''}** before working again.${cooldownReduction}`
      );
    }

    // Random job and earnings
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    let earnings =
      Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

    // Apply premium multiplier
    const baseEarnings = earnings;
    earnings = premiumPerks.applyEconomyMultiplier(guildId, earnings);
    const premiumBonus = earnings - baseEarnings;

    economy.coins += earnings;
    economy.lastWork = now;

    db.set('economy', userId, economy);

    const tierBadge = premiumPerks.getTierBadge(guildId);
    const tierName = premiumPerks.getTierDisplayName(guildId);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`${tierBadge} Work Complete!`)
      .setDescription(
        `You worked as a **${job.name}** and earned **${earnings.toLocaleString()} coins**!${
          premiumBonus > 0
            ? `\n\n${tierBadge} **${tierName} Bonus:** +${premiumBonus.toLocaleString()} coins`
            : ''
        }`
      )
      .addFields({
        name: '💰 New Balance',
        value: `${economy.coins.toLocaleString()} coins`,
        inline: true,
      })
      .setFooter({
        text:
          cooldown < baseCooldown
            ? `${tierBadge} Reduced cooldown! Come back in ${Math.floor(cooldown / 60000)} minutes`
            : 'Come back in 1 hour to work again!',
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
