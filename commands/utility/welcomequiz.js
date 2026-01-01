const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'welcomequiz',
  aliases: ['quiz', 'verification'],
  description: 'Set up a welcome quiz for new members',
  usage: '<setup/add/remove/list>',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageGuild) &&
      action !== 'list'
    ) {
      return message.reply(
        '❌ You need **Manage Server** permission to manage the welcome quiz!'
      );
    }

    if (!action || action === 'list') {
      const quizData = db.get('welcome_quiz', message.guild.id);

      if (!quizData || !quizData.enabled) {
        const embed = new EmbedBuilder()
          .setColor(branding.colors.primary)
          .setTitle('📝 Welcome Quiz')
          .setDescription(
            '**Test new members with a custom quiz!**\n\n' +
              '**Features:**\n' +
              '• Custom questions & answers\n' +
              '• Auto-role assignment on pass\n' +
              '• Prevent spam/raids\n' +
              '• Track quiz statistics\n\n' +
              '**Setup:**\n' +
              '`//welcomequiz setup` - Initialize quiz\n' +
              '`//welcomequiz add <question> | <answer>` - Add question\n' +
              '`//welcomequiz remove <id>` - Remove question\n' +
              '`//welcomequiz list` - View questions'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📝 Welcome Quiz Questions')
        .setDescription(
          `**Status:** ${quizData.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `**Verified Role:** ${quizData.roleId ? `<@&${quizData.roleId}>` : 'Not set'}\n` +
            `**Pass Rate:** ${quizData.stats?.passRate || 0}%\n\n` +
            '**Questions:**'
        )
        .addFields(
          quizData.questions.map((q, i) => ({
            name: `${i + 1}. ${q.question}`,
            value: `✅ Answer: ||${q.answer}||\n🆔 ID: \`${q.id}\``,
            inline: false,
          }))
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'setup') {
      const existing = db.get('welcome_quiz', message.guild.id);

      if (existing && existing.enabled) {
        return message.reply('⚠️ Welcome quiz is already set up!');
      }

      const quizData = {
        enabled: true,
        questions: [
          {
            id: '1',
            question: 'Have you read the server rules?',
            answer: 'yes',
          },
          {
            id: '2',
            question: 'Will you be respectful to other members?',
            answer: 'yes',
          },
          {
            id: '3',
            question: 'Are you here to spam or advertise?',
            answer: 'no',
          },
        ],
        roleId: null,
        stats: {
          totalAttempts: 0,
          totalPasses: 0,
          passRate: 0,
        },
      };

      db.set('welcome_quiz', message.guild.id, quizData);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Welcome Quiz Initialized!')
        .setDescription(
          '**Default questions have been added:**\n\n' +
            '1. Have you read the server rules?\n' +
            '2. Will you be respectful to other members?\n' +
            '3. Are you here to spam or advertise?\n\n' +
            '**Next Steps:**\n' +
            '• Add more questions: `//welcomequiz add <question> | <answer>`\n' +
            '• Set verified role: Create a role and use `//welcomequiz role <@role>`\n' +
            '• View questions: `//welcomequiz list`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'add') {
      const quizData = db.get('welcome_quiz', message.guild.id);

      if (!quizData) {
        return message.reply(
          '❌ Please run `//welcomequiz setup` first!'
        );
      }

      const questionData = args
        .slice(1)
        .join(' ')
        .split('|')
        .map(s => s.trim());

      if (questionData.length !== 2) {
        return message.reply(
          '❌ Format: `//welcomequiz add <question> | <answer>`\n' +
            'Example: `//welcomequiz add What is 2+2? | 4`'
        );
      }

      const [question, answer] = questionData;

      if (quizData.questions.length >= 10) {
        return message.reply('❌ Maximum 10 questions allowed!');
      }

      const newQuestion = {
        id: Date.now().toString(),
        question,
        answer: answer.toLowerCase(),
      };

      quizData.questions.push(newQuestion);
      db.set('welcome_quiz', message.guild.id, quizData);

      return message.reply(
        `✅ Question added!\n**Q:** ${question}\n**A:** ||${answer}||`
      );
    }

    if (action === 'remove') {
      const questionId = args[1];

      if (!questionId) {
        return message.reply('❌ Please provide a question ID!');
      }

      const quizData = db.get('welcome_quiz', message.guild.id);

      if (!quizData) {
        return message.reply(
          '❌ Please run `//welcomequiz setup` first!'
        );
      }

      const index = quizData.questions.findIndex(q => q.id === questionId);

      if (index === -1) {
        return message.reply('❌ Question not found!');
      }

      const removed = quizData.questions.splice(index, 1)[0];
      db.set('welcome_quiz', message.guild.id, quizData);

      return message.reply(`✅ Removed question: **${removed.question}**`);
    }

    if (action === 'role') {
      const role =
        message.mentions.roles.first() ||
        message.guild.roles.cache.get(args[1]);

      if (!role) {
        return message.reply('❌ Please mention a valid role!');
      }

      const quizData = db.get('welcome_quiz', message.guild.id);

      if (!quizData) {
        return message.reply(
          '❌ Please run `//welcomequiz setup` first!'
        );
      }

      quizData.roleId = role.id;
      db.set('welcome_quiz', message.guild.id, quizData);

      return message.reply(
        `✅ Verified role set to ${role}! Members will receive this role after passing the quiz.`
      );
    }
  },
};
