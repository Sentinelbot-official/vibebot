const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Store active games
const activeGames = new Map();

const words = [
  'DISCORD',
  'JAVASCRIPT',
  'PYTHON',
  'COMPUTER',
  'PROGRAMMING',
  'KEYBOARD',
  'MONITOR',
  'INTERNET',
  'SOFTWARE',
  'HARDWARE',
  'DATABASE',
  'ALGORITHM',
  'FUNCTION',
  'VARIABLE',
  'DEVELOPER',
  'ENGINEER',
  'TECHNOLOGY',
  'NETWORK',
  'SERVER',
  'CLIENT',
  'BROWSER',
  'WEBSITE',
  'APPLICATION',
  'MOBILE',
  'DESKTOP',
  'LAPTOP',
  'TABLET',
  'SMARTPHONE',
  'GAMING',
  'STREAMING',
  'YOUTUBE',
  'TWITCH',
  'REDDIT',
  'GITHUB',
  'STACKOVERFLOW',
];

const hangmanStages = [
  '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```',
];

module.exports = {
  name: 'hangman',
  description: 'Play a game of Hangman',
  category: 'fun',
  cooldown: 5,
  async execute(message) {
    if (activeGames.has(message.channel.id)) {
      return message.reply(
        '❌ There is already an active Hangman game in this channel!'
      );
    }

    const word = words[Math.floor(Math.random() * words.length)];
    const guessed = new Set();
    const wrongGuesses = [];

    const gameData = {
      word,
      guessed,
      wrongGuesses,
      playerId: message.author.id,
      startTime: Date.now(),
    };

    activeGames.set(message.channel.id, gameData);

    await updateGame(message.channel, gameData);

    // Set up collector for guesses
    const filter = m =>
      m.author.id === message.author.id &&
      m.content.length === 1 &&
      /^[A-Z]$/i.test(m.content);
    const collector = message.channel.createMessageCollector({
      filter,
      time: 120000,
    }); // 2 minutes

    collector.on('collect', async m => {
      const guess = m.content.toUpperCase();

      if (guessed.has(guess)) {
        await m.reply('❌ You already guessed that letter!').then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 3000);
        });
        return;
      }

      guessed.add(guess);

      if (word.includes(guess)) {
        // Correct guess
        await m.react('✅').catch(() => {});

        // Check if won
        if ([...word].every(letter => guessed.has(letter))) {
          collector.stop('won');
        } else {
          await updateGame(message.channel, gameData);
        }
      } else {
        // Wrong guess
        wrongGuesses.push(guess);
        await m.react('❌').catch(() => {});

        // Check if lost
        if (wrongGuesses.length >= 6) {
          collector.stop('lost');
        } else {
          await updateGame(message.channel, gameData);
        }
      }

      // Delete guess message after a delay
      setTimeout(() => m.delete().catch(() => {}), 2000);
    });

    collector.on('end', async (collected, reason) => {
      activeGames.delete(message.channel.id);

      if (reason === 'won') {
        const timeTaken = Math.floor((Date.now() - gameData.startTime) / 1000);
        const embed = new EmbedBuilder()
          .setColor(branding.colors.success)
          .setTitle('🎉 Hangman - You Won!')
          .setDescription(
            `**Word:** ${word}\n\n✅ Congratulations! You guessed the word!`
          )
          .addFields(
            {
              name: '⏱️ Time Taken',
              value: `${timeTaken} seconds`,
              inline: true,
            },
            {
              name: '❌ Wrong Guesses',
              value: wrongGuesses.length.toString(),
              inline: true,
            }
          )
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      } else if (reason === 'lost') {
        const embed = new EmbedBuilder()
          .setColor(branding.colors.error)
          .setTitle('💀 Hangman - Game Over!')
          .setDescription(
            `${hangmanStages[6]}\n\n**Word:** ${word}\n\n❌ You ran out of guesses!`
          )
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(branding.colors.warning)
          .setTitle("⏱️ Hangman - Time's Up!")
          .setDescription(
            `**Word:** ${word}\n\nThe game has ended due to inactivity.`
          )
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      }
    });
  },
};

async function updateGame(channel, gameData) {
  const { word, guessed, wrongGuesses } = gameData;

  const displayWord = [...word]
    .map(letter => (guessed.has(letter) ? letter : '_'))
    .join(' ');
  const guessedLetters = [...guessed].sort().join(', ') || 'None';
  const wrongLetters = wrongGuesses.join(', ') || 'None';

  const embed = new EmbedBuilder()
    .setColor(branding.colors.info)
    .setTitle('🎮 Hangman')
    .setDescription(
      `${hangmanStages[wrongGuesses.length]}\n\n**Word:** ${displayWord}`
    )
    .addFields(
      { name: '✅ Guessed Letters', value: guessedLetters, inline: false },
      {
        name: '❌ Wrong Guesses',
        value: `${wrongLetters} (${wrongGuesses.length}/6)`,
        inline: false,
      },
      {
        name: '💡 How to Play',
        value: 'Type a single letter to guess!',
        inline: false,
      }
    )
    .setFooter(branding.footers.default)
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}
