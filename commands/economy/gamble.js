const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'gamble',
  description: 'Gamble your coins with a chance to win big',
  usage: '<amount|all>',
  aliases: ['bet', 'gambling'],
  category: 'economy',
  cooldown: 10,
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Usage: `gamble <amount|all>`');
    }

    const userData = db.get('economy', message.author.id) || {
      wallet: 0,
      bank: 0,
    };

    if (userData.wallet === 0) {
      return message.reply('❌ You need coins in your wallet to gamble!');
    }

    let amount;
    if (args[0].toLowerCase() === 'all') {
      amount = userData.wallet;
    } else {
      amount = parseInt(args[0]);
    }

    if (isNaN(amount) || amount < 1) {
      return message.reply('❌ Please provide a valid amount!');
    }

    if (amount > userData.wallet) {
      return message.reply(
        `❌ You don't have enough coins! You have **${userData.wallet}** coins in your wallet.`
      );
    }

    // Minimum bet
    if (amount < 10) {
      return message.reply('❌ Minimum bet is **10** coins!');
    }

    // Gambling logic
    const roll = Math.random();
    let winnings = 0;
    let multiplier = 0;
    let result;

    if (roll < 0.45) {
      // 45% chance - lose
      result = 'lose';
      winnings = -amount;
    } else if (roll < 0.80) {
      // 35% chance - small win (1.5x)
      result = 'small_win';
      multiplier = 1.5;
      winnings = Math.floor(amount * multiplier) - amount;
    } else if (roll < 0.95) {
      // 15% chance - medium win (2x)
      result = 'medium_win';
      multiplier = 2;
      winnings = Math.floor(amount * multiplier) - amount;
    } else if (roll < 0.99) {
      // 4% chance - big win (3x)
      result = 'big_win';
      multiplier = 3;
      winnings = Math.floor(amount * multiplier) - amount;
    } else {
      // 1% chance - jackpot (5x)
      result = 'jackpot';
      multiplier = 5;
      winnings = Math.floor(amount * multiplier) - amount;
    }

    // Update balance
    userData.wallet += winnings;
    db.set('economy', message.author.id, userData);

    // Result messages
    const messages = {
      lose: '💔 You lost!',
      small_win: '🎉 Small win!',
      medium_win: '🎊 Nice win!',
      big_win: '🎆 BIG WIN!',
      jackpot: '💰 JACKPOT! 🎰',
    };

    const colors = {
      lose: 0xff0000,
      small_win: 0xffa500,
      medium_win: 0x00ff00,
      big_win: 0x00ffff,
      jackpot: 0xffd700,
    };

    const embed = new EmbedBuilder()
      .setColor(colors[result])
      .setTitle('🎰 Gambling Results')
      .setDescription(
        `${messages[result]}\n\n` +
          `**Bet:** ${amount} coins\n` +
          (multiplier > 0 ? `**Multiplier:** ${multiplier}x\n` : '') +
          `**${winnings >= 0 ? 'Won' : 'Lost'}:** ${Math.abs(winnings)} coins\n\n` +
          `**New Balance:** ${userData.wallet} coins`
      )
      .setFooter({ text: `${message.author.tag}'s gambling session` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
