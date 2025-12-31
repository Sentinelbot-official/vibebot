const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'trivia',
  description: 'Answer trivia questions to earn coins',
  usage: '',
  aliases: ['quiz'],
  category: 'economy',
  cooldown: 30,
  async execute(message, args) {
    const questions = [
      {
        question: 'What is the capital of France?',
        answers: ['Paris', 'London', 'Berlin', 'Madrid'],
        correct: 0,
        reward: 50,
      },
      {
        question: 'Which planet is known as the Red Planet?',
        answers: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correct: 1,
        reward: 50,
      },
      {
        question: 'What is 2 + 2?',
        answers: ['3', '4', '5', '22'],
        correct: 1,
        reward: 25,
      },
      {
        question: 'Who painted the Mona Lisa?',
        answers: ['Van Gogh', 'Picasso', 'Da Vinci', 'Monet'],
        correct: 2,
        reward: 75,
      },
      {
        question: 'What is the largest ocean on Earth?',
        answers: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
        correct: 3,
        reward: 50,
      },
      {
        question: 'How many continents are there?',
        answers: ['5', '6', '7', '8'],
        correct: 2,
        reward: 50,
      },
      {
        question: 'What is the speed of light?',
        answers: [
          '299,792 km/s',
          '150,000 km/s',
          '500,000 km/s',
          '1,000,000 km/s',
        ],
        correct: 0,
        reward: 100,
      },
      {
        question: 'Who wrote "Romeo and Juliet"?',
        answers: ['Dickens', 'Shakespeare', 'Hemingway', 'Tolkien'],
        correct: 1,
        reward: 75,
      },
      {
        question: 'What year did World War II end?',
        answers: ['1943', '1944', '1945', '1946'],
        correct: 2,
        reward: 75,
      },
      {
        question: 'What is the smallest country in the world?',
        answers: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
        correct: 1,
        reward: 100,
      },
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];

    const buttons = question.answers.map((answer, index) =>
      new ButtonBuilder()
        .setCustomId(`trivia_${index}`)
        .setLabel(answer)
        .setStyle(ButtonStyle.Primary)
    );

    const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 2));
    const row2 = new ActionRowBuilder().addComponents(buttons.slice(2, 4));

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🧠 Trivia Question')
      .setDescription(
        `${question.question}\n\n` +
          `**Reward:** ${question.reward} coins\n` +
          `**Time Limit:** 15 seconds`
      )
      .setFooter({ text: `Trivia for ${message.author.tag}` })
      .setTimestamp();

    const msg = await message.reply({
      embeds: [embed],
      components: [row1, row2],
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
    });

    let answered = false;

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: '❌ This is not your trivia question!',
          ephemeral: true,
        });
      }

      if (answered) return;
      answered = true;

      const answerIndex = parseInt(interaction.customId.split('_')[1]);
      const correct = answerIndex === question.correct;

      if (correct) {
        // Give reward
        const userData = db.get('economy', message.author.id) || {
          wallet: 0,
          bank: 0,
        };
        userData.wallet += question.reward;
        db.set('economy', message.author.id, userData);

        const winEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Correct!')
          .setDescription(
            `You answered correctly!\n\n` +
              `**Reward:** +${question.reward} coins\n` +
              `**New Balance:** ${userData.wallet} coins`
          )
          .setTimestamp();

        await interaction.update({ embeds: [winEmbed], components: [] });
      } else {
        const loseEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Wrong!')
          .setDescription(
            `That's incorrect!\n\n` +
              `The correct answer was: **${question.answers[question.correct]}**`
          )
          .setTimestamp();

        await interaction.update({ embeds: [loseEmbed], components: [] });
      }

      collector.stop();
    });

    collector.on('end', collected => {
      if (!answered) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("⏱️ Time's Up!")
          .setDescription(
            `You didn't answer in time!\n\n` +
              `The correct answer was: **${question.answers[question.correct]}**`
          )
          .setTimestamp();

        msg.edit({ embeds: [timeoutEmbed], components: [] });
      }
    });
  },
};
