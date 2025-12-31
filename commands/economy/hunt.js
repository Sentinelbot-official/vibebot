const db = require('../../utils/database');

const animals = [
  { name: '🐰 Rabbit', value: 20 },
  { name: '🦌 Deer', value: 50 },
  { name: '🦊 Fox', value: 40 },
  { name: '🐗 Boar', value: 75 },
  { name: '🐻 Bear', value: 150 },
  { name: '🦅 Eagle', value: 100 },
  { name: '🦆 Duck', value: 30 },
  { name: '🦝 Raccoon', value: 35 },
  { name: '🦌 Moose', value: 125 },
  { name: '🐿️ Squirrel', value: 15 },
];

module.exports = {
  name: 'hunt',
  aliases: ['hunting'],
  description: 'Go hunting for coins',
  category: 'economy',
  cooldown: 60, // 1 minute
  async execute(message, _args) {
    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    const success = Math.random() > 0.3; // 70% success rate

    if (success) {
      const caught = animals[Math.floor(Math.random() * animals.length)];
      economy.coins += caught.value;
      db.set('economy', message.author.id, economy);

      message.reply(
        `🏹 You hunted a ${caught.name} and earned **${caught.value.toLocaleString()}** coins!`
      );
    } else {
      message.reply("🏹 You went hunting but didn't catch anything!");
    }
  },
};
