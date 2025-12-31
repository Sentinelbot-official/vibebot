const { EmbedBuilder } = require('discord.js');

// Store active games
const activeGames = new Map();

const words = [
  'ABOUT',
  'ABOVE',
  'ABUSE',
  'ACTOR',
  'ACUTE',
  'ADMIT',
  'ADOPT',
  'ADULT',
  'AFTER',
  'AGAIN',
  'AGENT',
  'AGREE',
  'AHEAD',
  'ALARM',
  'ALBUM',
  'ALERT',
  'ALIGN',
  'ALIKE',
  'ALIVE',
  'ALLOW',
  'ALONE',
  'ALONG',
  'ALTER',
  'ANGEL',
  'ANGER',
  'ANGLE',
  'ANGRY',
  'APART',
  'APPLE',
  'APPLY',
  'ARENA',
  'ARGUE',
  'ARISE',
  'ARRAY',
  'ASIDE',
  'ASSET',
  'AUDIO',
  'AVOID',
  'AWARD',
  'AWARE',
  'BADLY',
  'BAKER',
  'BASES',
  'BASIC',
  'BEACH',
  'BEGAN',
  'BEGIN',
  'BEING',
  'BELOW',
  'BENCH',
  'BILLY',
  'BIRTH',
  'BLACK',
  'BLAME',
  'BLIND',
  'BLOCK',
  'BLOOD',
  'BOARD',
  'BOOST',
  'BOOTH',
  'BOUND',
  'BRAIN',
  'BRAND',
  'BREAD',
  'BREAK',
  'BREED',
  'BRIEF',
  'BRING',
  'BROAD',
  'BROKE',
  'BROWN',
  'BUILD',
  'BUILT',
  'BUYER',
  'CABLE',
  'CALIF',
  'CARRY',
  'CATCH',
  'CAUSE',
  'CHAIN',
  'CHAIR',
  'CHART',
  'CHASE',
  'CHEAP',
  'CHECK',
  'CHEST',
  'CHIEF',
  'CHILD',
  'CHINA',
  'CHOSE',
  'CIVIL',
  'CLAIM',
  'CLASS',
  'CLEAN',
  'CLEAR',
  'CLICK',
  'CLOCK',
  'CLOSE',
  'COACH',
  'COAST',
];

module.exports = {
  name: 'wordle',
  description: 'Play a game of Wordle (guess the 5-letter word)',
  category: 'fun',
  cooldown: 5,
  async execute(message) {
    if (activeGames.has(message.channel.id)) {
      return message.reply(
        '❌ There is already an active Wordle game in this channel!'
      );
    }

    const word = words[Math.floor(Math.random() * words.length)];
    const guesses = [];

    const gameData = {
      word,
      guesses,
      playerId: message.author.id,
      startTime: Date.now(),
    };

    activeGames.set(message.channel.id, gameData);

    const embed = new EmbedBuilder()
      .setColor(0x538d4e)
      .setTitle('🎮 Wordle')
      .setDescription(
        'Guess the 5-letter word! You have 6 attempts.\n\n🟩 = Correct letter in correct position\n🟨 = Correct letter in wrong position\n⬛ = Letter not in word'
      )
      .addFields({
        name: '💡 How to Play',
        value: 'Type a 5-letter word to make a guess!',
        inline: false,
      })
      .setFooter({ text: 'Game expires in 3 minutes' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Set up collector for guesses
    const filter = m =>
      m.author.id === message.author.id &&
      m.content.length === 5 &&
      /^[A-Z]+$/i.test(m.content);
    const collector = message.channel.createMessageCollector({
      filter,
      time: 180000,
    }); // 3 minutes

    collector.on('collect', async m => {
      const guess = m.content.toUpperCase();
      guesses.push(guess);

      const result = checkGuess(word, guess);

      // Check if won
      if (guess === word) {
        collector.stop('won');
      } else if (guesses.length >= 6) {
        collector.stop('lost');
      } else {
        await updateGame(message.channel, gameData);
      }

      // Delete guess message
      setTimeout(() => m.delete().catch(() => {}), 2000);
    });

    collector.on('end', async (collected, reason) => {
      activeGames.delete(message.channel.id);

      if (reason === 'won') {
        const timeTaken = Math.floor((Date.now() - gameData.startTime) / 1000);
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎉 Wordle - You Won!')
          .setDescription(
            getGameBoard(gameData) +
              `\n\n✅ Congratulations! You guessed the word: **${word}**`
          )
          .addFields(
            {
              name: '⏱️ Time Taken',
              value: `${timeTaken} seconds`,
              inline: true,
            },
            { name: '🎯 Attempts', value: `${guesses.length}/6`, inline: true }
          )
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      } else if (reason === 'lost') {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Wordle - Game Over!')
          .setDescription(
            getGameBoard(gameData) + `\n\n**The word was:** ${word}`
          )
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x808080)
          .setTitle("⏱️ Wordle - Time's Up!")
          .setDescription(
            `**The word was:** ${word}\n\nThe game has ended due to inactivity.`
          )
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      }
    });
  },
};

function checkGuess(word, guess) {
  const result = [];
  const wordArray = [...word];
  const guessArray = [...guess];

  // First pass: mark correct positions
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === wordArray[i]) {
      result[i] = '🟩';
      wordArray[i] = null;
      guessArray[i] = null;
    }
  }

  // Second pass: mark wrong positions
  for (let i = 0; i < 5; i++) {
    if (guessArray[i] !== null) {
      const index = wordArray.indexOf(guessArray[i]);
      if (index !== -1) {
        result[i] = '🟨';
        wordArray[index] = null;
      } else {
        result[i] = '⬛';
      }
    }
  }

  return result;
}

function getGameBoard(gameData) {
  const { word, guesses } = gameData;
  let board = '';

  for (const guess of guesses) {
    const result = checkGuess(word, guess);
    board += `${[...guess].join(' ')}  ${result.join('')}\n`;
  }

  // Add empty rows
  for (let i = guesses.length; i < 6; i++) {
    board += `_ _ _ _ _\n`;
  }

  return '```\n' + board + '```';
}

async function updateGame(channel, gameData) {
  const board = getGameBoard(gameData);

  const embed = new EmbedBuilder()
    .setColor(0x538d4e)
    .setTitle('🎮 Wordle')
    .setDescription(
      board + '\n🟩 = Correct position\n🟨 = Wrong position\n⬛ = Not in word'
    )
    .addFields({
      name: '🎯 Attempts',
      value: `${gameData.guesses.length}/6`,
      inline: true,
    })
    .setFooter({ text: 'Type a 5-letter word to guess!' })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}
