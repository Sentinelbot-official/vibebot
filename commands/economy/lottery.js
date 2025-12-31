const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'lottery',
  description: 'Buy a lottery ticket for a chance to win the jackpot',
  usage: '[buy|info]',
  aliases: ['lotto'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase() || 'info';

    // Get lottery data
    const lotteryData = db.get('lottery', 'global') || {
      jackpot: 10000,
      participants: [],
      lastDraw: Date.now(),
    };

    const ticketPrice = 100;

    if (action === 'info') {
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🎫 Lottery Information')
        .setDescription(
          'The lottery is a server-wide game where you can win big!\n\n' +
            `**Current Jackpot:** ${lotteryData.jackpot} coins\n` +
            `**Ticket Price:** ${ticketPrice} coins\n` +
            `**Participants:** ${lotteryData.participants.length}\n\n` +
            'Use `lottery buy` to purchase a ticket!\n' +
            'Draw happens automatically when 10+ tickets are sold.'
        )
        .setFooter({ text: 'Good luck!' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const userData = db.get('economy', message.author.id) || {
        wallet: 0,
        bank: 0,
      };

      if (userData.wallet < ticketPrice) {
        return message.reply(
          `❌ You need **${ticketPrice}** coins to buy a lottery ticket! You have **${userData.wallet}** coins.`
        );
      }

      // Check if user already has a ticket
      if (lotteryData.participants.includes(message.author.id)) {
        return message.reply('❌ You already have a ticket for this draw!');
      }

      // Buy ticket
      userData.wallet -= ticketPrice;
      db.set('economy', message.author.id, userData);

      lotteryData.participants.push(message.author.id);
      lotteryData.jackpot += ticketPrice;
      db.set('lottery', 'global', lotteryData);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎫 Lottery Ticket Purchased!')
        .setDescription(
          `You bought a lottery ticket for **${ticketPrice}** coins!\n\n` +
            `**Current Jackpot:** ${lotteryData.jackpot} coins\n` +
            `**Your Chances:** 1/${lotteryData.participants.length}\n\n` +
            'Good luck! 🍀'
        )
        .setFooter({ text: `Remaining balance: ${userData.wallet} coins` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      // Auto-draw if 10+ participants
      if (lotteryData.participants.length >= 10) {
        setTimeout(() => this.drawLottery(message.channel), 3000);
      }
    }
  },

  async drawLottery(channel) {
    const lotteryData = db.get('lottery', 'global');

    if (!lotteryData || lotteryData.participants.length === 0) return;

    // Pick random winner
    const winnerId =
      lotteryData.participants[
        Math.floor(Math.random() * lotteryData.participants.length)
      ];

    const winner = await channel.client.users.fetch(winnerId).catch(() => null);

    if (winner) {
      // Give winnings
      const userData = db.get('economy', winnerId) || { wallet: 0, bank: 0 };
      userData.wallet += lotteryData.jackpot;
      db.set('economy', winnerId, userData);

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🎰 LOTTERY DRAW! 🎰')
        .setDescription(
          `**Winner:** ${winner.tag}\n` +
            `**Jackpot:** ${lotteryData.jackpot} coins\n` +
            `**Participants:** ${lotteryData.participants.length}\n\n` +
            'Congratulations! 🎉'
        )
        .setThumbnail(winner.displayAvatarURL())
        .setTimestamp();

      channel.send({ content: `🎉 <@${winnerId}>`, embeds: [embed] });
    }

    // Reset lottery
    db.set('lottery', 'global', {
      jackpot: 10000,
      participants: [],
      lastDraw: Date.now(),
    });
  },
};
