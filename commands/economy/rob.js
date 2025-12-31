const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'rob',
  aliases: ['steal'],
  description: 'Attempt to rob another user',
  usage: '<@user>',
  category: 'economy',
  cooldown: 300, // 5 minutes
  async execute(message, args) {
    const target = message.mentions.users.first();

    if (!target) {
      return message.reply('❌ Please mention a user to rob!');
    }

    if (target.id === message.author.id) {
      return message.reply("❌ You can't rob yourself!");
    }

    if (target.bot) {
      return message.reply("❌ You can't rob bots!");
    }

    const robberEconomy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };
    const targetEconomy = db.get('economy', target.id) || { coins: 0, bank: 0 };

    // Need at least 100 coins to attempt robbery
    if (robberEconomy.coins < 100) {
      return message.reply(
        '❌ You need at least 100 coins to attempt a robbery!'
      );
    }

    // Target must have coins
    if (targetEconomy.coins < 50) {
      return message.reply(
        `❌ ${target.username} doesn't have enough coins to rob!`
      );
    }

    // 50% success rate
    const success = Math.random() < 0.5;

    if (success) {
      // Steal 10-30% of their coins
      const percentage = Math.random() * 0.2 + 0.1; // 10-30%
      const stolen = Math.floor(targetEconomy.coins * percentage);

      robberEconomy.coins += stolen;
      targetEconomy.coins -= stolen;

      db.set('economy', message.author.id, robberEconomy);
      db.set('economy', target.id, targetEconomy);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('💰 Robbery Successful!')
        .setDescription(
          `You successfully robbed **${stolen.toLocaleString()} coins** from ${target}!`
        )
        .addFields({
          name: 'Your Balance',
          value: `${robberEconomy.coins.toLocaleString()} coins`,
          inline: true,
        })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } else {
      // Failed - lose 20% of your coins as fine
      const fine = Math.floor(robberEconomy.coins * 0.2);
      robberEconomy.coins -= fine;

      db.set('economy', message.author.id, robberEconomy);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🚨 Robbery Failed!')
        .setDescription(
          `You got caught! You paid a fine of **${fine.toLocaleString()} coins**.`
        )
        .addFields({
          name: 'Your Balance',
          value: `${robberEconomy.coins.toLocaleString()} coins`,
          inline: true,
        })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    }
  },
};
