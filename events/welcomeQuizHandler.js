const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../utils/database');
const branding = require('../utils/branding');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const quizData = db.get('welcome_quiz', member.guild.id);

    if (!quizData || !quizData.enabled || quizData.questions.length === 0) {
      return;
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription(
          '**Before you can access the server, please complete this quick quiz:**\n\n' +
            `📝 **${quizData.questions.length} questions**\n` +
            `⏱️ **No time limit**\n` +
            `✅ **All questions must be answered correctly**\n\n` +
            'Click the button below to start!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_start_${member.id}`)
          .setLabel('Start Quiz')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Primary)
      );

      const dmMessage = await member.send({
        embeds: [embed],
        components: [row],
      });

      // Set up collector
      const collector = dmMessage.createMessageComponentCollector({
        time: 30 * 60 * 1000, // 30 minutes
      });

      let currentQuestion = 0;

      collector.on('collect', async interaction => {
        if (interaction.customId === `quiz_start_${member.id}`) {
          await askQuestion(interaction, 0);
        }
      });

      async function askQuestion(interaction, questionIndex) {
        if (questionIndex >= quizData.questions.length) {
          // Quiz completed successfully
          const successEmbed = new EmbedBuilder()
            .setColor(branding.colors.success)
            .setTitle('✅ Quiz Passed!')
            .setDescription(
              `**Congratulations!** You've successfully completed the quiz.\n\n` +
                `You now have access to **${member.guild.name}**! 🎉`
            )
            .setFooter(branding.footers.default)
            .setTimestamp();

          await interaction.update({
            embeds: [successEmbed],
            components: [],
          });

          // Assign role if configured
          if (quizData.roleId) {
            const role = member.guild.roles.cache.get(quizData.roleId);
            if (role) {
              await member.roles.add(role);
            }
          }

          // Update stats
          quizData.stats.totalAttempts++;
          quizData.stats.totalPasses++;
          quizData.stats.passRate = Math.round(
            (quizData.stats.totalPasses / quizData.stats.totalAttempts) * 100
          );
          db.set('welcome_quiz', member.guild.id, quizData);

          return;
        }

        const question = quizData.questions[questionIndex];

        const questionEmbed = new EmbedBuilder()
          .setColor(branding.colors.primary)
          .setTitle(`📝 Question ${questionIndex + 1}/${quizData.questions.length}`)
          .setDescription(
            `**${question.question}**\n\n` +
              'Type your answer in the chat below:'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        await interaction.update({
          embeds: [questionEmbed],
          components: [],
        });

        // Wait for answer
        const filter = m => m.author.id === member.id;
        const answerCollector = interaction.channel.createMessageCollector({
          filter,
          max: 1,
          time: 5 * 60 * 1000, // 5 minutes per question
        });

        answerCollector.on('collect', async answerMsg => {
          const userAnswer = answerMsg.content.toLowerCase().trim();
          const correctAnswer = question.answer.toLowerCase().trim();

          if (userAnswer === correctAnswer) {
            // Correct answer
            const correctEmbed = new EmbedBuilder()
              .setColor(branding.colors.success)
              .setTitle('✅ Correct!')
              .setDescription('Moving to the next question...')
              .setFooter(branding.footers.default);

            const nextButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`quiz_next_${member.id}_${questionIndex + 1}`)
                .setLabel('Next Question')
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Primary)
            );

            const msg = await interaction.channel.send({
              embeds: [correctEmbed],
              components: [nextButton],
            });

            const nextCollector = msg.createMessageComponentCollector({
              time: 60 * 1000,
            });

            nextCollector.on('collect', async nextInteraction => {
              await askQuestion(nextInteraction, questionIndex + 1);
            });
          } else {
            // Wrong answer
            const wrongEmbed = new EmbedBuilder()
              .setColor(branding.colors.error)
              .setTitle('❌ Incorrect Answer')
              .setDescription(
                `The correct answer was: **${question.answer}**\n\n` +
                  'Please try again later or contact a moderator for help.'
              )
              .setFooter(branding.footers.default)
              .setTimestamp();

            await interaction.channel.send({ embeds: [wrongEmbed] });

            // Update stats
            quizData.stats.totalAttempts++;
            quizData.stats.passRate = Math.round(
              (quizData.stats.totalPasses / quizData.stats.totalAttempts) * 100
            );
            db.set('welcome_quiz', member.guild.id, quizData);
          }
        });

        answerCollector.on('end', (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            const timeoutEmbed = new EmbedBuilder()
              .setColor(branding.colors.error)
              .setTitle('⏱️ Time Expired')
              .setDescription(
                'You took too long to answer. Please try again later.'
              )
              .setFooter(branding.footers.default)
              .setTimestamp();

            interaction.channel.send({ embeds: [timeoutEmbed] });
          }
        });
      }
    } catch (error) {
      console.error('Error sending welcome quiz:', error);
      // User might have DMs disabled
    }
  },
};
