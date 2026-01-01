const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'pollchart',
  aliases: ['poll', 'vote', 'survey'],
  description: 'Create interactive polls with visual charts',
  usage: '<question> | <option1> | <option2> | [option3] ...',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📊 Poll System')
        .setDescription(
          '**Create interactive polls with live results!**\n\n' +
            '**Usage:**\n' +
            '`//poll <question> | <option1> | <option2> | [option3]...`\n\n' +
            '**Examples:**\n' +
            '• `//poll What game? | Valorant | League | Fortnite`\n' +
            '• `//poll Best time to stream? | Morning | Afternoon | Evening | Night`\n\n' +
            '**Features:**\n' +
            '• Visual bar charts\n' +
            '• Live vote counting\n' +
            '• Multiple choice (2-10 options)\n' +
            '• Anonymous voting\n' +
            '• Auto-updating results'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const pollData = args.join(' ').split('|').map(s => s.trim());

    if (pollData.length < 3) {
      return message.reply(
        '❌ Please provide a question and at least 2 options!\n' +
          'Format: `//poll Question | Option 1 | Option 2`'
      );
    }

    if (pollData.length > 11) {
      return message.reply('❌ Maximum 10 options allowed!');
    }

    const question = pollData[0];
    const options = pollData.slice(1);

    if (question.length > 256) {
      return message.reply('❌ Question too long! Max 256 characters.');
    }

    // Create poll
    const pollId = Date.now().toString();
    const votes = {};
    const voters = new Set();

    options.forEach((_, i) => {
      votes[i] = 0;
    });

    const generateEmbed = () => {
      const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

      const resultsText = options
        .map((option, i) => {
          const voteCount = votes[i];
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const barLength = Math.round(percentage / 5);
          const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

          return (
            `**${i + 1}. ${option}**\n` +
            `${bar} ${percentage.toFixed(1)}%\n` +
            `${branding.formatNumber(voteCount)} vote${voteCount !== 1 ? 's' : ''}`
          );
        })
        .join('\n\n');

      return new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`📊 ${question}`)
        .setDescription(
          resultsText +
            `\n\n**Total Votes:** ${branding.formatNumber(totalVotes)}\n` +
            `**Unique Voters:** ${branding.formatNumber(voters.size)}`
        )
        .setFooter({
          text: branding.getFooterText('Click a button to vote!'),
        })
        .setTimestamp();
    };

    const generateButtons = () => {
      const rows = [];
      let currentRow = new ActionRowBuilder();

      options.forEach((option, i) => {
        if (i > 0 && i % 5 === 0) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
        }

        const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i];

        currentRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_${pollId}_${i}`)
            .setLabel(option.substring(0, 80))
            .setEmoji(emoji)
            .setStyle(ButtonStyle.Primary)
        );
      });

      if (currentRow.components.length > 0) {
        rows.push(currentRow);
      }

      return rows;
    };

    const pollMsg = await message.channel.send({
      embeds: [generateEmbed()],
      components: generateButtons(),
    });

    // Store poll data
    const polls = db.get('polls', message.guild.id) || {};
    polls[pollId] = {
      id: pollId,
      messageId: pollMsg.id,
      channelId: message.channel.id,
      question,
      options,
      votes,
      voters: Array.from(voters),
      createdBy: message.author.id,
      createdAt: Date.now(),
    };
    db.set('polls', message.guild.id, polls);

    // Set up collector
    const collector = pollMsg.createMessageComponentCollector({
      time: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    collector.on('collect', async interaction => {
      const optionIndex = parseInt(interaction.customId.split('_')[2]);

      // Check if already voted
      if (voters.has(interaction.user.id)) {
        return interaction.reply({
          content: '⚠️ You already voted in this poll!',
          ephemeral: true,
        });
      }

      // Record vote
      votes[optionIndex]++;
      voters.add(interaction.user.id);

      // Update database
      polls[pollId].votes = votes;
      polls[pollId].voters = Array.from(voters);
      db.set('polls', message.guild.id, polls);

      // Update message
      await interaction.update({
        embeds: [generateEmbed()],
        components: generateButtons(),
      });

      await interaction.followUp({
        content: `✅ Vote recorded for **${options[optionIndex]}**!`,
        ephemeral: true,
      });
    });

    collector.on('end', () => {
      pollMsg
        .edit({
          embeds: [generateEmbed()],
          components: [],
        })
        .catch(() => {});
    });

    await message.reply(
      `✅ Poll created! Results will update in real-time as people vote.`
    );
  },
};
