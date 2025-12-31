const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const jobs = {
  developer: { name: 'Developer', salary: 500, emoji: '💻', requirement: 5 },
  designer: { name: 'Designer', salary: 400, emoji: '🎨', requirement: 3 },
  teacher: { name: 'Teacher', salary: 350, emoji: '👨‍🏫', requirement: 2 },
  chef: { name: 'Chef', salary: 300, emoji: '👨‍🍳', requirement: 1 },
  cashier: { name: 'Cashier', salary: 200, emoji: '💰', requirement: 0 },
};

module.exports = {
  name: 'job',
  description: 'Get a job to earn regular income',
  usage: '[apply/quit/list]',
  aliases: ['work', 'career'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    const userData = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
      job: null,
    };
    const leveling = db.get('leveling', message.author.id) || { level: 1 };

    if (!action || action === 'status') {
      if (!userData.job) {
        return message.reply(
          "❌ You don't have a job! Use `job list` to see available jobs."
        );
      }

      const job = jobs[userData.job];
      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle(`${job.emoji} Your Job`)
        .setDescription(`**${job.name}**`)
        .addFields(
          {
            name: '💰 Salary',
            value: `${job.salary} coins per work`,
            inline: true,
          },
          {
            name: '📊 Level Required',
            value: job.requirement.toString(),
            inline: true,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'list') {
      const jobList = Object.entries(jobs)
        .map(([key, job]) => {
          const canApply = leveling.level >= job.requirement;
          const status = canApply ? '✅' : '🔒';
          return `${status} ${job.emoji} **${job.name}** - ${job.salary} coins (Level ${job.requirement}+)`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle('💼 Available Jobs')
        .setDescription(jobList)
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'apply') {
      if (userData.job) {
        return message.reply(
          '❌ You already have a job! Use `job quit` first.'
        );
      }

      const jobName = args[1]?.toLowerCase();
      if (!jobName || !jobs[jobName]) {
        return message.reply(
          '❌ Invalid job! Use `job list` to see available jobs.'
        );
      }

      const job = jobs[jobName];
      if (leveling.level < job.requirement) {
        return message.reply(
          `❌ You need to be level ${job.requirement} to apply for this job!`
        );
      }

      userData.job = jobName;
      db.set('economy', message.author.id, userData);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('🎉 Job Accepted!')
        .setDescription(`You are now a **${job.name}**!`)
        .addFields({
          name: '💰 Salary',
          value: `${job.salary} coins per work`,
          inline: true,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'quit') {
      if (!userData.job) {
        return message.reply("❌ You don't have a job!");
      }

      const job = jobs[userData.job];
      userData.job = null;
      db.set('economy', message.author.id, userData);

      return message.reply(`✅ You quit your job as a **${job.name}**.`);
    }

    return message.reply('❌ Usage: `job [apply/quit/list]`');
  },
};
