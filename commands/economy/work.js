const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

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
  description: 'Work to earn coins',
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
    };

    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // 1 hour
    const timeSinceWork = now - economy.lastWork;

    // Check cooldown
    if (timeSinceWork < cooldown) {
      const timeLeft = cooldown - timeSinceWork;
      const minutes = Math.floor(timeLeft / (60 * 1000));

      return message.reply(
        `⏱️ You're tired! Rest for **${minutes} minute${minutes !== 1 ? 's' : ''}** before working again.`
      );
    }

    // Random job and earnings
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earnings =
      Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

    economy.coins += earnings;
    economy.lastWork = now;

    db.set('economy', userId, economy);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('💼 Work Complete!')
      .setDescription(
        `You worked as a **${job.name}** and earned **${earnings} coins**!`
      )
      .addFields({
        name: '💰 New Balance',
        value: `${economy.coins.toLocaleString()} coins`,
        inline: true,
      })
      .setFooter({ text: 'Come back in 1 hour to work again!' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
