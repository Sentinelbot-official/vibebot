const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const activePolls = new Map();

module.exports = {
  name: 'advpoll',
  description: 'Create advanced polls with multiple options and timers',
  usage: '<duration> <question> | <option1> | <option2> | ...',
  aliases: ['apoll', 'polladvanced'],
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (args.length < 3) {
      return message.reply(
        '❌ Usage: `advpoll <duration> <question> | <option1> | <option2> | ...`\n\n' +
          '**Duration:** 1m, 5m, 1h, 1d, etc.\n' +
          '**Max 10 options**\n\n' +
          '**Example:**\n' +
          "`advpoll 10m What's your favorite color? | Red | Blue | Green | Yellow`"
      );
    }

    const durationStr = args[0];
    const rest = args.slice(1).join(' ');
    const parts = rest.split('|').map(p => p.trim());

    if (parts.length < 3) {
      return message.reply(
        '❌ Please provide a question and at least 2 options!\nSeparate with | (pipe)'
      );
    }

    if (parts.length > 11) {
      return message.reply('❌ Maximum 10 options allowed!');
    }

    const question = parts[0];
    const options = parts.slice(1);

    // Parse duration
    const durationRegex = /^(\d+)([smhd])$/;
    const match = durationStr.match(durationRegex);

    if (!match) {
      return message.reply(
        '❌ Invalid duration! Use format like: 1m, 5m, 1h, 1d'
      );
    }

    const amount = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const duration = amount * multipliers[unit];

    if (duration < 10000 || duration > 604800000) {
      return message.reply(
        '❌ Duration must be between 10 seconds and 7 days!'
      );
    }

    // Create poll
    const pollId = `${message.author.id}-${Date.now()}`;
    const votes = {};
    options.forEach((_, i) => (votes[i] = []));

    const numberEmojis = [
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
    ];

    // Create buttons (max 5 per row, 2 rows max = 10 buttons)
    const rows = [];
    for (let i = 0; i < options.length; i += 5) {
      const row = new ActionRowBuilder();
      for (let j = i; j < Math.min(i + 5, options.length); j++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_${pollId}_${j}`)
            .setLabel(`${j + 1}. ${options[j].substring(0, 20)}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(numberEmojis[j])
        );
      }
      rows.push(row);
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle(`📊 ${question}`)
      .setDescription(
        options
          .map((opt, i) => `${numberEmojis[i]} **${opt}** - 0 votes (0%)`)
          .join('\n')
      )
      .setFooter(branding.footers.default)
      .setTimestamp(Date.now() + duration);

    const pollMsg = await message.channel.send({
      embeds: [embed],
      components: rows,
    });

    activePolls.set(pollId, {
      messageId: pollMsg.id,
      channelId: message.channel.id,
      question,
      options,
      votes,
      endTime: Date.now() + duration,
      authorId: message.author.id,
    });

    // Set timeout to end poll
    setTimeout(() => endPoll(pollId, message.client), duration);

    const collector = pollMsg.createMessageComponentCollector({
      time: duration,
    });

    collector.on('collect', async i => {
      const [, id, optionIndex] = i.customId.split('_');
      const poll = activePolls.get(id);

      if (!poll) {
        return i.reply({
          content: '❌ Poll expired!',
          flags: MessageFlags.Ephemeral,
        });
      }

      const option = parseInt(optionIndex);

      // Remove previous vote
      for (const votes of Object.values(poll.votes)) {
        const index = votes.indexOf(i.user.id);
        if (index > -1) votes.splice(index, 1);
      }

      // Add new vote
      poll.votes[option].push(i.user.id);

      // Update embed
      const totalVotes = Object.values(poll.votes).reduce(
        (sum, v) => sum + v.length,
        0
      );
      const description = poll.options
        .map((opt, idx) => {
          const count = poll.votes[idx].length;
          const percentage =
            totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
          return `${numberEmojis[idx]} **${opt}** - ${count} votes (${percentage}%)`;
        })
        .join('\n');

      const newEmbed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle(`📊 ${poll.question}`)
        .setDescription(description)
        .setFooter(branding.footers.default)
        .setTimestamp(poll.endTime);

      await i.update({ embeds: [newEmbed] });
    });
  },
};

async function endPoll(pollId, client) {
  const poll = activePolls.get(pollId);
  if (!poll) return;

  try {
    const channel = await client.channels.fetch(poll.channelId);
    const pollMsg = await channel.messages.fetch(poll.messageId);

    const totalVotes = Object.values(poll.votes).reduce(
      (sum, v) => sum + v.length,
      0
    );
    const numberEmojis = [
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
    ];

    // Find winner
    let maxVotes = 0;
    let winners = [];
    poll.options.forEach((opt, idx) => {
      const count = poll.votes[idx].length;
      if (count > maxVotes) {
        maxVotes = count;
        winners = [idx];
      } else if (count === maxVotes) {
        winners.push(idx);
      }
    });

    const description = poll.options
      .map((opt, idx) => {
        const count = poll.votes[idx].length;
        const percentage =
          totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
        const isWinner = winners.includes(idx);
        return `${numberEmojis[idx]} **${opt}** - ${count} votes (${percentage}%)${isWinner ? ' 🏆' : ''}`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(branding.colors.success)
      .setTitle(`📊 ${poll.question} [ENDED]`)
      .setDescription(description)
      .addFields({
        name: '🏆 Winner',
        value: winners.map(i => poll.options[i]).join(', ') || 'No votes',
        inline: false,
      })
      .setFooter(branding.footers.default)
      .setTimestamp();

    await pollMsg.edit({ embeds: [embed], components: [] });
    activePolls.delete(pollId);
  } catch (error) {
    console.error('Error ending poll:', error);
    activePolls.delete(pollId);
  }
}
