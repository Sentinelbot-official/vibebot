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
  name: 'challenge',
  aliases: ['challenges', 'communitychallenge'],
  description: 'Create and participate in community challenges',
  usage: '[create/list/join/leaderboard]',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'list') {
      const challenges = db.get('challenges', message.guild.id) || {};
      const active = Object.values(challenges).filter(
        c => c.endDate > Date.now()
      );

      if (active.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(branding.colors.primary)
          .setTitle('🏆 Community Challenges')
          .setDescription(
            '**Compete with your community!**\n\n' +
              '**Challenge Types:**\n' +
              '• 💬 **Message Challenge** - Send the most messages\n' +
              '• 🎤 **Voice Challenge** - Spend the most time in voice\n' +
              '• 💰 **Economy Challenge** - Earn the most coins\n' +
              '• ⭐ **Level Challenge** - Gain the most XP\n' +
              '• 🎮 **Custom Challenge** - Set your own goal\n\n' +
              '**Commands:**\n' +
              '`//challenge create` - Create a challenge (Admin)\n' +
              '`//challenge list` - View active challenges\n' +
              '`//challenge join <id>` - Join a challenge\n' +
              '`//challenge leaderboard <id>` - View rankings'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🏆 Active Challenges')
        .setDescription(
          active
            .map(
              c =>
                `**${c.emoji} ${c.name}**\n` +
                `📝 ${c.description}\n` +
                `🎯 Type: ${c.type}\n` +
                `👥 Participants: ${c.participants.length}\n` +
                `⏰ Ends: <t:${Math.floor(c.endDate / 1000)}:R>\n` +
                `🆔 ID: \`${c.id}\``
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'create') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply(
          '❌ You need **Manage Server** permission to create challenges!'
        );
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🏆 Create Challenge')
        .setDescription(
          '**Choose a challenge type:**\n\n' +
            '1️⃣ **Message Challenge** - Most messages sent\n' +
            '2️⃣ **Voice Challenge** - Most time in voice\n' +
            '3️⃣ **Economy Challenge** - Most coins earned\n' +
            '4️⃣ **Level Challenge** - Most XP gained\n' +
            '5️⃣ **Custom Challenge** - Set your own goal'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('challenge_messages')
          .setLabel('Messages')
          .setEmoji('💬')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('challenge_voice')
          .setLabel('Voice')
          .setEmoji('🎤')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('challenge_economy')
          .setLabel('Economy')
          .setEmoji('💰')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('challenge_level')
          .setLabel('Levels')
          .setEmoji('⭐')
          .setStyle(ButtonStyle.Primary)
      );

      const msg = await message.reply({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        time: 60 * 1000,
      });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: '❌ Only the command user can select this!',
            ephemeral: true,
          });
        }

        const type = interaction.customId.replace('challenge_', '');
        const typeEmojis = {
          messages: '💬',
          voice: '🎤',
          economy: '💰',
          level: '⭐',
        };

        const challengeId = Date.now().toString();
        const challenges = db.get('challenges', message.guild.id) || {};

        challenges[challengeId] = {
          id: challengeId,
          name: `${typeEmojis[type]} ${type.charAt(0).toUpperCase() + type.slice(1)} Challenge`,
          description: `Compete to have the most ${type} this week!`,
          type,
          emoji: typeEmojis[type],
          startDate: Date.now(),
          endDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          participants: [],
          scores: {},
          createdBy: message.author.id,
        };

        db.set('challenges', message.guild.id, challenges);

        const successEmbed = new EmbedBuilder()
          .setColor(branding.colors.success)
          .setTitle('✅ Challenge Created!')
          .setDescription(
            `**${challenges[challengeId].name}**\n\n` +
              `📝 ${challenges[challengeId].description}\n` +
              `⏰ Duration: 7 days\n` +
              `🆔 ID: \`${challengeId}\`\n\n` +
              'Members can join with `//challenge join ' +
              challengeId +
              '`'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        await interaction.update({
          embeds: [successEmbed],
          components: [],
        });
      });
    }

    if (action === 'join') {
      const challengeId = args[1];

      if (!challengeId) {
        return message.reply('❌ Please provide a challenge ID!');
      }

      const challenges = db.get('challenges', message.guild.id) || {};
      const challenge = challenges[challengeId];

      if (!challenge) {
        return message.reply('❌ Challenge not found!');
      }

      if (challenge.endDate < Date.now()) {
        return message.reply('❌ This challenge has ended!');
      }

      if (challenge.participants.includes(message.author.id)) {
        return message.reply(
          '⚠️ You are already participating in this challenge!'
        );
      }

      challenge.participants.push(message.author.id);
      challenge.scores[message.author.id] = 0;
      db.set('challenges', message.guild.id, challenges);

      return message.reply(
        `✅ You've joined **${challenge.name}**! Good luck! 🏆`
      );
    }

    if (action === 'leaderboard') {
      const challengeId = args[1];

      if (!challengeId) {
        return message.reply('❌ Please provide a challenge ID!');
      }

      const challenges = db.get('challenges', message.guild.id) || {};
      const challenge = challenges[challengeId];

      if (!challenge) {
        return message.reply('❌ Challenge not found!');
      }

      // Calculate scores based on challenge type
      const scores = await this.calculateScores(challenge, message.guild);

      const sortedScores = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (sortedScores.length === 0) {
        return message.reply('📊 No participants yet!');
      }

      const medals = ['🥇', '🥈', '🥉'];

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🏆 ${challenge.name} - Leaderboard`)
        .setDescription(
          `**Ends:** <t:${Math.floor(challenge.endDate / 1000)}:R>\n\n` +
            sortedScores
              .map(([userId, score], i) => {
                const medal = medals[i] || `**${i + 1}.**`;
                return `${medal} <@${userId}> - ${branding.formatNumber(score)} ${this.getScoreUnit(challenge.type)}`;
              })
              .join('\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },

  async calculateScores(challenge, guild) {
    const scores = {};

    for (const userId of challenge.participants) {
      const userData = db.get('users', userId);

      if (!userData) {
        scores[userId] = 0;
        continue;
      }

      switch (challenge.type) {
        case 'messages':
          scores[userId] = userData.messages || 0;
          break;
        case 'voice':
          scores[userId] = userData.voiceTime || 0;
          break;
        case 'economy':
          scores[userId] = userData.wallet || 0;
          break;
        case 'level':
          scores[userId] = userData.xp || 0;
          break;
        default:
          scores[userId] = 0;
      }
    }

    return scores;
  },

  getScoreUnit(type) {
    const units = {
      messages: 'messages',
      voice: 'minutes',
      economy: 'coins',
      level: 'XP',
    };
    return units[type] || 'points';
  },
};
