const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'coinflip',
  aliases: ['cf', 'flip'],
  description: 'Flip a coin and gamble your coins',
  usage: '<heads|tails> <amount>',
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply('❌ Usage: `coinflip <heads|tails> <amount>`');
    }

    const choice = args[0].toLowerCase();
    if (
      choice !== 'heads' &&
      choice !== 'tails' &&
      choice !== 'h' &&
      choice !== 't'
    ) {
      return message.reply('❌ Choose heads or tails!');
    }

    const userChoice =
      choice === 'h' ? 'heads' : choice === 't' ? 'tails' : choice;

    let bet;
    if (args[1].toLowerCase() === 'all') {
      const economy = db.get('economy', message.author.id) || { coins: 0 };
      bet = economy.coins;
    } else {
      bet = parseInt(args[1]);
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

    // Flip the coin
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === userChoice;

    if (won) {
      economy.coins += bet;
    } else {
      economy.coins -= bet;
    }

    db.set('economy', message.author.id, economy);

    const embed = new EmbedBuilder()
      .setColor(won ? 0x00ff00 : 0xff0000)
      .setTitle('🪙 Coinflip')
      .setDescription(
        `You chose: **${userChoice}**\n` +
          `Result: **${result}**\n\n` +
          (won
            ? `✅ You won **${bet.toLocaleString()} coins**!`
            : `❌ You lost **${bet.toLocaleString()} coins**!`)
      )
      .addFields({
        name: '💰 New Balance',
        value: `${economy.coins.toLocaleString()} coins`,
        inline: true,
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
