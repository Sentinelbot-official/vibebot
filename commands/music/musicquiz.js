const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'musicquiz',
  aliases: ['songquiz', 'guessthesong'],
  description: 'Play a music quiz game',
  usage: '[difficulty]',
  category: 'music',
  cooldown: 30,
  guildOnly: true,
  async execute(message, args) {
    const difficulty = args[0]?.toLowerCase() || 'medium';

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return message.reply('❌ Invalid difficulty! Choose: `easy`, `medium`, or `hard`');
    }

    const musicManager = require('../../utils/musicManager');
    const queue = musicManager.getQueue(message.guild.id);

    if (!queue || queue.songs.length < 5) {
      return message.reply('❌ Not enough songs in queue history! Play at least 5 songs first.');
    }

    // Start quiz
    const quizSongs = selectQuizSongs(queue.history || [], difficulty);

    if (quizSongs.length === 0) {
      return message.reply('❌ Not enough song history to create a quiz!');
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🎵 Music Quiz Starting!')
      .setDescription(
        `**Difficulty:** ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}\n` +
          `**Questions:** ${quizSongs.length}\n` +
          `**Points:** ${getPointsPerQuestion(difficulty)} per correct answer\n\n` +
          'Get ready! Quiz starts in 3 seconds...'
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Run quiz
    const scores = {};
    let questionNumber = 1;

    for (const quizSong of quizSongs) {
      const questionEmbed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🎵 Question ${questionNumber}/${quizSongs.length}`)
        .setDescription(
          generateQuestion(quizSong, difficulty) +
            '\n\n**Type your answer in chat!**\n' +
            `⏱️ You have 15 seconds...`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      const questionMsg = await message.channel.send({ embeds: [questionEmbed] });

      // Collect answers
      const filter = m => !m.author.bot && m.channel.id === message.channel.id;
      const collector = message.channel.createMessageCollector({
        filter,
        time: 15000,
        max: 50,
      });

      const correctAnswers = new Set();

      collector.on('collect', async m => {
        if (correctAnswers.has(m.author.id)) return;

        if (isCorrectAnswer(m.content, quizSong, difficulty)) {
          correctAnswers.add(m.author.id);
          scores[m.author.id] = (scores[m.author.id] || 0) + getPointsPerQuestion(difficulty);

          await m.react('✅');
        }
      });

      await new Promise(resolve => {
        collector.on('end', resolve);
      });

      // Show answer
      const answerEmbed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Answer')
        .setDescription(
          `**${quizSong.title}**\n\n` +
            `**Correct Answers:** ${correctAnswers.size}\n` +
            (correctAnswers.size > 0
              ? Array.from(correctAnswers)
                  .map(id => `<@${id}>`)
                  .join(', ')
              : 'Nobody got it!')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await message.channel.send({ embeds: [answerEmbed] });

      questionNumber++;

      if (questionNumber <= quizSongs.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Show final scores
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    if (sortedScores.length === 0) {
      return message.channel.send('😅 Nobody scored any points! Better luck next time!');
    }

    const medals = ['🥇', '🥈', '🥉'];

    const finalEmbed = new EmbedBuilder()
      .setColor(branding.colors.success)
      .setTitle('🏆 Music Quiz Results!')
      .setDescription(
        sortedScores
          .map(([userId, score], i) => {
            const medal = medals[i] || `**${i + 1}.**`;
            return `${medal} <@${userId}> - ${score} points`;
          })
          .join('\n')
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    await message.channel.send({ embeds: [finalEmbed] });

    // Save stats
    for (const [userId, score] of Object.entries(scores)) {
      const stats = db.get('music_quiz_stats', userId) || {
        gamesPlayed: 0,
        totalScore: 0,
        highScore: 0,
      };

      stats.gamesPlayed++;
      stats.totalScore += score;
      stats.highScore = Math.max(stats.highScore, score);

      db.set('music_quiz_stats', userId, stats);
    }
  },
};

function selectQuizSongs(history, difficulty) {
  const count = { easy: 5, medium: 7, hard: 10 }[difficulty];
  const shuffled = [...history].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateQuestion(song, difficulty) {
  const questions = {
    easy: [
      `What is the title of this song?\n🎵 _${song.title}_`,
      `Name this song:\n🎵 _${song.title.substring(0, 10)}..._`,
    ],
    medium: [
      `What song is this?\n🎵 _${song.title.split(' ').slice(0, 2).join(' ')}..._`,
      `Guess the song from these lyrics:\n🎵 _(Hint: ${song.title.charAt(0)})_`,
    ],
    hard: [
      `What song is this? (First letter: ${song.title.charAt(0)})`,
      `Identify this track from the queue history`,
    ],
  };

  const options = questions[difficulty];
  return options[Math.floor(Math.random() * options.length)];
}

function isCorrectAnswer(answer, song, difficulty) {
  const answerLower = answer.toLowerCase().trim();
  const titleLower = song.title.toLowerCase();

  if (difficulty === 'easy') {
    return titleLower.includes(answerLower) || answerLower.includes(titleLower);
  } else if (difficulty === 'medium') {
    const titleWords = titleLower.split(' ');
    const answerWords = answerLower.split(' ');
    return titleWords.some(w => answerWords.includes(w)) || answerWords.some(w => titleWords.includes(w));
  } else {
    return titleLower === answerLower;
  }
}

function getPointsPerQuestion(difficulty) {
  return { easy: 10, medium: 20, hard: 30 }[difficulty];
}
