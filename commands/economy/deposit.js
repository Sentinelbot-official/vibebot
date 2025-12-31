const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const transactionLock = require('../../utils/transactionLock');
const branding = require('../../utils/branding');

module.exports = {
  name: 'deposit',
  aliases: ['dep'],
  description: 'Deposit coins into your bank',
  usage: '<amount|all>',
  category: 'economy',
  cooldown: 3,
  async execute(message, args) {
    const userId = message.author.id;

    if (!args[0]) {
      return message.reply(
        '❌ Please specify an amount to deposit! Usage: `deposit <amount|all>`'
      );
    }

    // Use transaction lock to prevent race conditions
    await transactionLock.withLock(userId, async () => {
      // Get user economy data
      const economy = db.get('economy', userId) || {
        coins: 0,
        bank: 0,
        lastDaily: 0,
        lastWork: 0,
      };

      let amount;

      if (args[0].toLowerCase() === 'all') {
        amount = economy.coins;
      } else {
        amount = parseInt(args[0]);

        if (isNaN(amount) || amount <= 0) {
          return message.reply('❌ Please enter a valid amount!');
        }
      }

      if (amount > economy.coins) {
        return message.reply(
          `❌ You don't have that many coins! You have **${economy.coins.toLocaleString()} coins** in your wallet.`
        );
      }

      economy.coins -= amount;
      economy.bank += amount;

      db.set('economy', userId, economy);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🏦 Deposit Successful!')
        .setDescription(
          `Deposited **${amount.toLocaleString()} coins** into your bank.`
        )
        .addFields(
          {
            name: '💰 Wallet',
            value: `${economy.coins.toLocaleString()} coins`,
            inline: true,
          },
          {
            name: '🏦 Bank',
            value: `${economy.bank.toLocaleString()} coins`,
            inline: true,
          }
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    });
  },
};
