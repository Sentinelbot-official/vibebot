const { EmbedBuilder } = require('discord.js');

const choices = ['rock', 'paper', 'scissors'];
const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

module.exports = {
  name: 'rps',
  description: 'Play rock paper scissors',
  usage: '<rock|paper|scissors>',
  category: 'fun',
  cooldown: 3,
  execute(message, args) {
    if (!args[0]) {
      return message.reply('❌ Choose: rock, paper, or scissors!');
    }

    const userChoice = args[0].toLowerCase();
    if (!choices.includes(userChoice)) {
      return message.reply(
        '❌ Invalid choice! Choose: rock, paper, or scissors'
      );
    }

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result;
    if (userChoice === botChoice) {
      result = "It's a tie!";
    } else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = 'You win! 🎉';
    } else {
      result = 'You lose! 😢';
    }

    const embed = new EmbedBuilder()
      .setColor(
        result.includes('win')
          ? 0x00ff00
          : result.includes('lose')
            ? 0xff0000
            : 0xffff00
      )
      .setTitle('✊ Rock Paper Scissors')
      .addFields(
        {
          name: 'You chose',
          value: `${emojis[userChoice]} ${userChoice}`,
          inline: true,
        },
        {
          name: 'I chose',
          value: `${emojis[botChoice]} ${botChoice}`,
          inline: true,
        },
        { name: 'Result', value: result, inline: false }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
