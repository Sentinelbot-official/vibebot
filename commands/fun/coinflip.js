const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'coinflip',
  description: 'Flip a coin',
  usage: '[heads|tails]',
  aliases: ['flip', 'coin'],
  category: 'fun',
  cooldown: 2,
  async execute(message, args) {
    const choices = ['heads', 'tails'];
    const result = choices[Math.floor(Math.random() * choices.length)];

    let userChoice = null;
    let won = false;

    if (args.length > 0) {
      userChoice = args[0].toLowerCase();
      if (!choices.includes(userChoice)) {
        return message.reply('❌ Please choose either `heads` or `tails`!');
      }
      won = userChoice === result;
    }

    const embed = new EmbedBuilder()
      .setColor(won ? 0x00ff00 : userChoice ? 0xff0000 : 0x5865f2)
      .setTitle('🪙 Coin Flip')
      .setDescription(
        `The coin landed on: **${result.toUpperCase()}**!\n\n` +
          (userChoice
            ? won
              ? '✅ You won!'
              : `❌ You lost! You chose ${userChoice}.`
            : '')
      )
      .setFooter({ text: `Flipped by ${message.author.tag}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
