const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'minigame',
  aliases: ['game', 'quickgame'],
  description: 'Quick minigames collection',
  usage: '<rps/flip/dice/8ball/trivia>',
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    const game = args[0]?.toLowerCase();

    if (!game || !['rps', 'flip', 'dice', '8ball', 'trivia'].includes(game)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎮 Minigames')
        .setDescription(
          '**Quick games to play!**\n\n' +
            '**Available Games:**\n' +
            '🪨 `//minigame rps` - Rock Paper Scissors\n' +
            '🪙 `//minigame flip` - Coin Flip\n' +
            '🎲 `//minigame dice` - Roll Dice\n' +
            '🎱 `//minigame 8ball <question>` - Magic 8-Ball\n' +
            '🧠 `//minigame trivia` - Quick Trivia'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (game === 'rps') {
      const choice = args[1]?.toLowerCase();
      const options = ['rock', 'paper', 'scissors'];

      if (!choice || !options.includes(choice)) {
        return message.reply('❌ Choose: rock, paper, or scissors!');
      }

      const botChoice = options[Math.floor(Math.random() * options.length)];
      const result = determineWinner(choice, botChoice);

      return message.reply(
        `You chose **${choice}**, I chose **${botChoice}**\n${result}`
      );
    }

    if (game === 'flip') {
      const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
      return message.reply(`🪙 The coin landed on **${result}**!`);
    }

    if (game === 'dice') {
      const roll = Math.floor(Math.random() * 6) + 1;
      return message.reply(`🎲 You rolled a **${roll}**!`);
    }

    if (game === '8ball') {
      const question = args.slice(1).join(' ');

      if (!question) {
        return message.reply('❌ Ask me a question!');
      }

      const responses = [
        'Yes, definitely!',
        'It is certain.',
        'Without a doubt.',
        'Most likely.',
        'Outlook good.',
        'Signs point to yes.',
        'Reply hazy, try again.',
        'Ask again later.',
        'Cannot predict now.',
        "Don't count on it.",
        'My reply is no.',
        'Very doubtful.',
      ];

      const answer = responses[Math.floor(Math.random() * responses.length)];
      return message.reply(`🎱 ${answer}`);
    }

    if (game === 'trivia') {
      const questions = [
        {
          q: 'What is the capital of France?',
          a: 'Paris',
          options: ['London', 'Paris', 'Berlin', 'Madrid'],
        },
        {
          q: 'What is 2 + 2?',
          a: '4',
          options: ['3', '4', '5', '6'],
        },
        {
          q: 'What color is the sky?',
          a: 'Blue',
          options: ['Red', 'Blue', 'Green', 'Yellow'],
        },
      ];

      const question = questions[Math.floor(Math.random() * questions.length)];

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🧠 Quick Trivia')
        .setDescription(
          `**${question.q}**\n\n` +
            question.options.map((o, i) => `${i + 1}. ${o}`).join('\n') +
            '\n\nType the number of your answer!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      const filter = m =>
        m.author.id === message.author.id && /^[1-4]$/.test(m.content);
      const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000,
      });

      if (collected.size === 0) {
        return message.reply("⏱️ Time's up!");
      }

      const answer = collected.first();
      const userAnswer = question.options[parseInt(answer.content) - 1];

      if (userAnswer === question.a) {
        return message.reply('✅ Correct! +100 coins!');
      } else {
        return message.reply(`❌ Wrong! The answer was **${question.a}**.`);
      }
    }
  },
};

function determineWinner(player, bot) {
  if (player === bot) return "🤝 It's a tie!";

  const wins = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  };

  return wins[player] === bot ? '🎉 You win!' : '😔 I win!';
}
