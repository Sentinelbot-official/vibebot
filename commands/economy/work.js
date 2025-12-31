const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');
const branding = require('../../utils/branding');

const jobs = [
  { name: 'programmer', min: 100, max: 300, emoji: '💻' },
  { name: 'designer', min: 80, max: 250, emoji: '🎨' },
  { name: 'Twitch streamer', min: 150, max: 400, emoji: '🔴' },
  { name: 'chef', min: 90, max: 200, emoji: '👨‍🍳' },
  { name: 'teacher', min: 70, max: 180, emoji: '📚' },
  { name: 'doctor', min: 200, max: 500, emoji: '⚕️' },
  { name: 'artist', min: 60, max: 220, emoji: '🎭' },
  { name: 'musician', min: 100, max: 350, emoji: '🎵' },
  { name: 'community manager', min: 120, max: 320, emoji: '💜' },
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

    const workMessages = [
      'Great job!',
      'You crushed it!',
      'Nailed it!',
      'Vibing at work!',
      'That\'s the hustle!',
      'Work hard, vibe harder!',
    ];

    const embed = new EmbedBuilder()
      .setColor(branding.colors.success)
      .setTitle(`${job.emoji} ${branding.getRandom(workMessages)}`)
      .setDescription(
        `You worked as a **${job.name}** and earned **${branding.formatNumber(earnings)} coins**! ${branding.emojis.sparkles}${
          premiumBonus > 0
            ? `\n\n${tierBadge} **${tierName} Bonus:** +${branding.formatNumber(premiumBonus)} coins`
            : ''
        }`
      )
      .addFields({
        name: '💰 New Balance',
        value: `${economy.coins.toLocaleString()} coins`,
        inline: true,
      })
      .setFooter(branding.footers.community)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
