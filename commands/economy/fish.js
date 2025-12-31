const db = require('../../utils/database');

const fish = [
  { name: '🐟 Small Fish', value: 10 },
  { name: '🐠 Tropical Fish', value: 25 },
  { name: '🐡 Pufferfish', value: 50 },
  { name: '🦈 Shark', value: 100 },
  { name: '🐋 Whale', value: 200 },
  { name: '🦑 Squid', value: 75 },
  { name: '🦞 Lobster', value: 150 },
  { name: '🦀 Crab', value: 60 },
  { name: '🐙 Octopus', value: 125 },
  { name: '👢 Old Boot', value: 1 },
];

module.exports = {
  name: 'fish',
  aliases: ['fishing'],
  description: 'Go fishing for coins',
  category: 'economy',
  cooldown: 60, // 1 minute
  async execute(message, args) {
    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    const caught = fish[Math.floor(Math.random() * fish.length)];
    economy.coins += caught.value;
    db.set('economy', message.author.id, economy);

    message.reply(
      `🎣 You caught a ${caught.name} and earned **${caught.value.toLocaleString()}** coins!`
    );
  },
};
