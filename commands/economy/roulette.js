const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const rouletteWheel = {
  0: 'green',
  1: 'red',
  2: 'black',
  3: 'red',
  4: 'black',
  5: 'red',
  6: 'black',
  7: 'red',
  8: 'black',
  9: 'red',
  10: 'black',
  11: 'black',
  12: 'red',
  13: 'black',
  14: 'red',
  15: 'black',
  16: 'red',
  17: 'black',
  18: 'red',
  19: 'red',
  20: 'black',
  21: 'red',
  22: 'black',
  23: 'red',
  24: 'black',
  25: 'red',
  26: 'black',
  27: 'red',
  28: 'black',
  29: 'black',
  30: 'red',
  31: 'black',
  32: 'red',
  33: 'black',
  34: 'red',
  35: 'black',
  36: 'red',
};

module.exports = {
  name: 'roulette',
  description: 'Play roulette',
  usage: '<bet> <red/black/green/number>',
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `roulette <amount> <red/black/green/number>`\n\n' +
          '**Bet Types:**\n' +
          '• `red` or `black` - 2x payout\n' +
          '• `green` (0) - 35x payout\n' +
          '• Specific number (0-36) - 35x payout\n\n' +
          '**Examples:**\n' +
          '`roulette 100 red`\n' +
          '`roulette 50 17`'
      );
    }

    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    let betAmount;
    if (args[0].toLowerCase() === 'all') {
      betAmount = economy.coins;
    } else {
      betAmount = parseInt(args[0]);
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply('❌ Please provide a valid bet amount!');
    }

    if (betAmount > economy.coins) {
      return message.reply(
        `❌ You don't have enough coins! You have ${economy.coins} coins.`
      );
    }

    const betType = args[1].toLowerCase();
    let validBet = false;
    let betOn;

    if (betType === 'red' || betType === 'black' || betType === 'green') {
      validBet = true;
      betOn = betType;
    } else {
      const number = parseInt(betType);
      if (!isNaN(number) && number >= 0 && number <= 36) {
        validBet = true;
        betOn = number;
      }
    }

    if (!validBet) {
      return message.reply(
        '❌ Invalid bet! Choose `red`, `black`, `green`, or a number (0-36).'
      );
    }

    // Spin the wheel
    const result = Math.floor(Math.random() * 37); // 0-36
    const resultColor = rouletteWheel[result];

    // Calculate winnings
    let won = false;
    let multiplier = 0;

    if (typeof betOn === 'number') {
      // Bet on specific number
      if (betOn === result) {
        won = true;
        multiplier = 35;
      }
    } else {
      // Bet on color
      if (betOn === resultColor) {
        won = true;
        multiplier = betOn === 'green' ? 35 : 2;
      }
    }

    const winnings = won ? betAmount * multiplier : -betAmount;
    economy.coins += winnings;
    db.set('economy', message.author.id, economy);

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('🎰 Roulette')
      .setColor(won ? 0x00ff00 : 0xff0000)
      .addFields(
        {
          name: '🎲 Result',
          value: `**${result}** (${resultColor === 'green' ? '🟢' : resultColor === 'red' ? '🔴' : '⚫'} ${resultColor})`,
          inline: true,
        },
        {
          name: '💰 Bet',
          value: `${betAmount} coins on ${typeof betOn === 'number' ? betOn : betOn}`,
          inline: true,
        },
        {
          name: won ? '✅ Won' : '❌ Lost',
          value: `${won ? '+' : ''}${winnings} coins`,
          inline: true,
        },
        {
          name: '💵 Balance',
          value: `${economy.coins} coins`,
          inline: false,
        }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
