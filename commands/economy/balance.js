const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'balance',
  aliases: ['bal', 'coins', 'money'],
  description: "Check your balance or another user's balance",
  usage: '[@user]',
  category: 'economy',
  cooldown: 3,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;

    // Get user economy data
    const economy = db.get('economy', user.id) || {
      coins: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0,
    };

    const total = economy.coins + economy.bank;

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({
        name: `${user.username}'s Balance`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
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
        },
        {
          name: '💎 Total',
          value: `${total.toLocaleString()} coins`,
          inline: true,
        }
      )
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
