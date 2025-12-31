const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const transactionLock = require('../../utils/transactionLock');
const branding = require('../../utils/branding');

module.exports = {
  name: 'gift',
  aliases: ['give', 'pay'],
  description: 'Gift coins to another user',
  usage: '<@user> <amount>',
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('❌ Please mention a user to gift coins to!');
    }

    if (user.id === message.author.id) {
      return message.reply("❌ You can't gift coins to yourself!");
    }

    if (user.bot) {
      return message.reply("❌ You can't gift coins to bots!");
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1) {
      return message.reply('❌ Please enter a valid amount!');
    }

    // Maximum gift amount to prevent abuse
    if (amount > 1000000) {
      return message.reply('❌ Maximum gift amount is 1,000,000 coins!');
    }

    // Use transaction lock to prevent race conditions
    await transactionLock.withMultipleLocks(
      [message.author.id, user.id],
      async () => {
        const senderEconomy = db.get('economy', message.author.id) || {
          coins: 0,
          bank: 0,
        };

        if (amount > senderEconomy.coins) {
          return message.reply(
            `❌ You don't have enough coins! You have ${senderEconomy.coins.toLocaleString()} coins.`
          );
        }

        // Transfer coins atomically
        senderEconomy.coins -= amount;
        db.set('economy', message.author.id, senderEconomy);

        const receiverEconomy = db.get('economy', user.id) || {
          coins: 0,
          bank: 0,
        };
        receiverEconomy.coins += amount;
        db.set('economy', user.id, receiverEconomy);

        const embed = new EmbedBuilder()
          .setColor(branding.colors.success)
          .setTitle('🎁 Gift Sent!')
          .setDescription(
            `${message.author} gifted **${amount.toLocaleString()} coins** to ${user}!`
          )
          .addFields(
            {
              name: 'Your Balance',
              value: `${senderEconomy.coins.toLocaleString()} coins`,
              inline: true,
            },
            {
              name: `${user.username}'s Balance`,
              value: `${receiverEconomy.coins.toLocaleString()} coins`,
              inline: true,
            }
          )
          .setTimestamp();

        message.reply({ embeds: [embed] });
      }
    );
  },
};
