const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const emojis = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
const multipliers = {
  '🍒🍒🍒': 2,
  '🍋🍋🍋': 3,
  '🍊🍊🍊': 4,
  '🍇🍇🍇': 5,
  '💎💎💎': 10,
  '7️⃣7️⃣7️⃣': 20,
};

module.exports = {
  name: 'slots',
  aliases: ['slot'],
  description: 'Play the slot machine',
  usage: '<amount>',
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    if (!args[0]) {
      return message.reply('❌ Usage: `slots <amount>`');
    }

    let bet;
    if (args[0].toLowerCase() === 'all') {
      const economy = db.get('economy', message.author.id) || { coins: 0 };
      bet = economy.coins;
    } else {
      bet = parseInt(args[0]);
    }

    if (isNaN(bet) || bet < 10) {
      return message.reply('❌ Minimum bet is 10 coins!');
    }

    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    if (bet > economy.coins) {
      return message.reply(
        `❌ You don't have enough coins! You have ${economy.coins.toLocaleString()} coins.`
      );
    }

    // Spin the slots
    const slot1 = emojis[Math.floor(Math.random() * emojis.length)];
    const slot2 = emojis[Math.floor(Math.random() * emojis.length)];
    const slot3 = emojis[Math.floor(Math.random() * emojis.length)];

    const result = `${slot1}${slot2}${slot3}`;
    const multiplier = multipliers[result] || 0;

    let winnings = 0;
    if (multiplier > 0) {
      winnings = bet * multiplier;
      economy.coins += winnings;
    } else {
      economy.coins -= bet;
    }

    db.set('economy', message.author.id, economy);

    const embed = new EmbedBuilder()
      .setColor(multiplier > 0 ? 0x00ff00 : 0xff0000)
      .setTitle('🎰 Slot Machine')
      .setDescription(
        `${slot1} | ${slot2} | ${slot3}\n\n` +
          (multiplier > 0
            ? `✅ You won **${winnings.toLocaleString()} coins**! (${multiplier}x)`
            : `❌ You lost **${bet.toLocaleString()} coins**!`)
      )
      .addFields({
        name: '💰 New Balance',
        value: `${economy.coins.toLocaleString()} coins`,
        inline: true,
      })
      .setFooter({ text: 'Match 3 symbols to win!' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
