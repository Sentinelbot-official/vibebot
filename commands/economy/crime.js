const db = require('../../utils/database');

const crimes = [
  { name: 'robbed a bank', min: 500, max: 2000, chance: 0.4 },
  { name: 'stole a car', min: 300, max: 1500, chance: 0.5 },
  { name: 'pickpocketed someone', min: 100, max: 500, chance: 0.6 },
  { name: 'hacked a computer', min: 400, max: 1800, chance: 0.45 },
  { name: 'sold illegal items', min: 200, max: 1000, chance: 0.55 },
];

module.exports = {
  name: 'crime',
  description: 'Commit a crime for money (risky!)',
  category: 'economy',
  cooldown: 300, // 5 minutes
  async execute(message, _args) {
    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    const crime = crimes[Math.floor(Math.random() * crimes.length)];
    const success = Math.random() < crime.chance;

    if (success) {
      const earned =
        Math.floor(Math.random() * (crime.max - crime.min + 1)) + crime.min;
      economy.coins += earned;
      db.set('economy', message.author.id, economy);

      message.reply(
        `✅ You successfully ${crime.name} and earned **${earned.toLocaleString()}** coins!`
      );
    } else {
      const lost = Math.floor(Math.random() * 500) + 100;
      economy.coins = Math.max(0, economy.coins - lost);
      db.set('economy', message.author.id, economy);

      message.reply(
        `❌ You got caught trying to ${crime.name.split(' ').slice(0, -1).join(' ')} and lost **${lost.toLocaleString()}** coins!`
      );
    }
  },
};
