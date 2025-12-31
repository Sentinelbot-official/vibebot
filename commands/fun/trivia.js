const { EmbedBuilder } = require('discord.js');

const triviaQuestions = [
  {
    question: 'What is the capital of France?',
    answer: 'paris',
    category: 'Geography',
  },
  { question: 'What is 2 + 2?', answer: '4', category: 'Math' },
  { question: 'What color is the sky?', answer: 'blue', category: 'General' },
  {
    question: 'How many continents are there?',
    answer: '7',
    category: 'Geography',
  },
  {
    question: 'What is the largest planet in our solar system?',
    answer: 'jupiter',
    category: 'Science',
  },
  {
    question: 'Who painted the Mona Lisa?',
    answer: 'leonardo da vinci',
    category: 'Art',
  },
  {
    question: 'What is the capital of Japan?',
    answer: 'tokyo',
    category: 'Geography',
  },
  {
    question: 'What is H2O commonly known as?',
    answer: 'water',
    category: 'Science',
  },
  {
    question: 'How many days are in a year?',
    answer: '365',
    category: 'General',
  },
  {
    question: 'What is the smallest prime number?',
    answer: '2',
    category: 'Math',
  },
  {
    question: 'What language is spoken in Brazil?',
    answer: 'portuguese',
    category: 'Geography',
  },
  {
    question: 'What is the speed of light?',
    answer: '299792458',
    category: 'Science',
  },
  {
    question: 'Who wrote Romeo and Juliet?',
    answer: 'shakespeare',
    category: 'Literature',
  },
  {
    question: 'What is the largest ocean?',
    answer: 'pacific',
    category: 'Geography',
  },
  {
    question: 'How many bones are in the human body?',
    answer: '206',
    category: 'Science',
  },
];

const activeTrivia = new Map();

module.exports = {
  name: 'trivia',
  description: 'Start a trivia question',
  category: 'fun',
  cooldown: 5,
  execute(message, args) {
    if (activeTrivia.has(message.channel.id)) {
      return message.reply(
        '❌ There is already an active trivia question in this channel!'
      );
    }

    const question =
      triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('🧠 Trivia Time!')
      .setDescription(question.question)
      .addFields({ name: 'Category', value: question.category, inline: true })
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });

    activeTrivia.set(message.channel.id, {
      answer: question.answer.toLowerCase(),
      askedBy: message.author.id,
    });

    // Set timeout
    setTimeout(() => {
      if (activeTrivia.has(message.channel.id)) {
        activeTrivia.delete(message.channel.id);
        message.channel.send(
          `⏰ Time's up! The answer was: **${question.answer}**`
        );
      }
    }, 30000);
  },

  // Check answer (called from messageCreate event)
  checkAnswer(message) {
    const trivia = activeTrivia.get(message.channel.id);
    if (!trivia) return false;

    const userAnswer = message.content.toLowerCase().trim();

    if (userAnswer === trivia.answer || userAnswer.includes(trivia.answer)) {
      activeTrivia.delete(message.channel.id);
      message.reply(`✅ Correct! The answer was: **${trivia.answer}**`);
      return true;
    }

    return false;
  },
};
