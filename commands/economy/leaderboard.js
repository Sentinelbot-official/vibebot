const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const premium = require('../../utils/premium');
const branding = require('../../utils/branding');

module.exports = {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  description: 'View server leaderboards with multiple types and filters',
  usage: '[economy|level|voice|messages] [global|weekly|monthly]',
  category: 'economy',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Parse arguments
    const validTypes = ['economy', 'level', 'voice', 'messages', 'xp'];
    const validFilters = ['global', 'weekly', 'monthly', 'all'];

    let type = 'economy';
    let filter = 'global';

    if (args[0] && validTypes.includes(args[0].toLowerCase())) {
      type = args[0].toLowerCase();
      if (type === 'xp') type = 'level'; // Alias
    }

    if (args[1] && validFilters.includes(args[1].toLowerCase())) {
      filter = args[1].toLowerCase();
      if (filter === 'all') filter = 'global'; // Alias
    }

    const tierName = premium.getServerTier(message.guild.id);
    const isPremium = tierName !== 'Free';

    // Get leaderboard data based on type
    let leaderboardData = [];

    if (type === 'economy') {
      const allEconomy = db.all('economy');
      if (!allEconomy || Object.keys(allEconomy).length === 0) {
        return message.reply('❌ No economy data found!');
      }

      leaderboardData = Object.entries(allEconomy)
        .map(([userId, data]) => ({
          userId,
          value: data.coins + data.bank,
          extra: `💰 ${(data.coins + data.bank).toLocaleString()} coins`,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (type === 'level') {
      const allLevels = db.all('levels');
      if (!allLevels || Object.keys(allLevels).length === 0) {
        return message.reply('❌ No level data found!');
      }

      leaderboardData = Object.entries(allLevels)
        .filter(([key]) => key.startsWith(message.guild.id))
        .map(([key, data]) => {
          const userId = key.split('-')[1];
          return {
            userId,
            value: data.xp,
            extra: `⭐ Level ${data.level} • ${data.xp.toLocaleString()} XP`,
          };
        })
        .sort((a, b) => b.value - a.value);
    } else if (type === 'voice') {
      const allVoice = db.all('voice_time');
      if (!allVoice || Object.keys(allVoice).length === 0) {
        return message.reply('❌ No voice activity data found!');
      }

      leaderboardData = Object.entries(allVoice)
        .filter(([key]) => key.startsWith(message.guild.id))
        .map(([key, data]) => {
          const userId = key.split('-')[1];
          const hours = Math.floor(data.totalTime / 3600);
          const minutes = Math.floor((data.totalTime % 3600) / 60);
          return {
            userId,
            value: data.totalTime,
            extra: `🎤 ${hours}h ${minutes}m`,
          };
        })
        .sort((a, b) => b.value - a.value);
    } else if (type === 'messages') {
      const allLevels = db.all('levels');
      if (!allLevels || Object.keys(allLevels).length === 0) {
        return message.reply('❌ No message data found!');
      }

      leaderboardData = Object.entries(allLevels)
        .filter(([key]) => key.startsWith(message.guild.id))
        .map(([key, data]) => {
          const userId = key.split('-')[1];
          return {
            userId,
            value: data.messages || 0,
            extra: `💬 ${(data.messages || 0).toLocaleString()} messages`,
          };
        })
        .sort((a, b) => b.value - a.value);
    }

    if (leaderboardData.length === 0) {
      return message.reply('❌ No data found for this leaderboard type!');
    }

    // Apply time filter if premium
    if (filter !== 'global' && !isPremium) {
      return message.reply(
        '❌ Time filters (weekly/monthly) are a **Premium** feature! Use `//premium` to learn more.'
      );
    }

    // Pagination setup
    const itemsPerPage = 10;
    let currentPage = 0;
    const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);

    // Find user's position
    const userPosition =
      leaderboardData.findIndex(u => u.userId === message.author.id) + 1;
    const userData = leaderboardData.find(u => u.userId === message.author.id);

    const generateEmbed = async page => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageData = leaderboardData.slice(start, end);

      const typeEmojis = {
        economy: '💰',
        level: '⭐',
        voice: '🎤',
        messages: '💬',
      };

      const typeNames = {
        economy: 'Wealth',
        level: 'Level',
        voice: 'Voice Time',
        messages: 'Messages',
      };

      const filterText =
        filter === 'global'
          ? 'All Time'
          : filter === 'weekly'
            ? 'This Week'
            : 'This Month';

      const embed = new EmbedBuilder()
        .setColor(isPremium ? branding.colors.premium : branding.colors.primary)
        .setTitle(
          `${typeEmojis[type]} ${typeNames[type]} Leaderboard ${isPremium ? '💎' : ''}`
        )
        .setDescription(
          `**Filter:** ${filterText}\n` +
            `**Server:** ${message.guild.name}\n` +
            `**Total Entries:** ${leaderboardData.length.toLocaleString()}\n\u200b`
        )
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setFooter(branding.footers.community)
        .setTimestamp();

      let description = '';
      for (let i = 0; i < pageData.length; i++) {
        const entry = pageData[i];
        const globalRank = start + i + 1;
        const member = await message.guild.members
          .fetch(entry.userId)
          .catch(() => null);
        const username = member ? member.user.username : `User ${entry.userId}`;

        const medal =
          globalRank === 1
            ? '🥇'
            : globalRank === 2
              ? '🥈'
              : globalRank === 3
                ? '🥉'
                : `**${globalRank}.**`;
        const isCurrentUser =
          entry.userId === message.author.id ? ' ⬅️ **YOU**' : '';

        description += `${medal} ${username}${isCurrentUser}\n${entry.extra}\n\n`;
      }

      embed.addFields({
        name: `🏆 Top ${start + 1}-${Math.min(end, leaderboardData.length)}`,
        value: description || 'No data',
        inline: false,
      });

      // Add user's stats if not on current page
      if (userData && (userPosition < start + 1 || userPosition > end)) {
        embed.addFields({
          name: '📊 Your Stats',
          value: `**Rank:** #${userPosition}\n${userData.extra}`,
          inline: false,
        });
      }

      return embed;
    };

    const embed = await generateEmbed(currentPage);

    // Create buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('first')
        .setLabel('⏮️ First')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀️ Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId('page')
        .setLabel(`${currentPage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next ▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1),
      new ButtonBuilder()
        .setCustomId('last')
        .setLabel('Last ⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages - 1)
    );

    const msg = await message.reply({
      embeds: [embed],
      components: totalPages > 1 ? [row] : [],
    });

    if (totalPages <= 1) return;

    // Button collector
    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async i => {
      if (i.customId === 'first') currentPage = 0;
      else if (i.customId === 'prev')
        currentPage = Math.max(0, currentPage - 1);
      else if (i.customId === 'next')
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      else if (i.customId === 'last') currentPage = totalPages - 1;

      const newEmbed = await generateEmbed(currentPage);
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('page')
          .setLabel(`${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1),
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1)
      );

      await i.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('page')
          .setLabel(`${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      msg.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};
