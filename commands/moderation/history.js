const {
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'history',
  aliases: ['modhistory', 'modlogs'],
  description:
    'View full moderation history of a user with pagination and filters',
  usage: '<@user> [active|all|decayed]',
  category: 'moderation',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You need Moderate Members permission!');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply(
        '❌ Usage: `history <@user> [active|all|decayed]`\n\n' +
          '**Filters:**\n' +
          '• `active` - Show only active warnings\n' +
          '• `all` - Show all warnings (default)\n' +
          '• `decayed` - Show only decayed warnings'
      );
    }

    const filter = args[1]?.toLowerCase() || 'all';
    if (!['active', 'all', 'decayed'].includes(filter)) {
      return message.reply(
        '❌ Invalid filter! Use: `active`, `all`, or `decayed`'
      );
    }

    let warns = db.get('warns', target.id) || [];

    if (warns.length === 0) {
      return message.reply(
        `✅ ${target.user.tag} has a clean record!\n\n` +
          `**Server:** ${message.guild.name}\n` +
          `**Checked:** <t:${Math.floor(Date.now() / 1000)}:R>`
      );
    }

    // Apply filter
    if (filter === 'active') {
      warns = warns.filter(w => w.active !== false);
    } else if (filter === 'decayed') {
      warns = warns.filter(w => w.active === false);
    }

    if (warns.length === 0) {
      return message.reply(
        `ℹ️ No ${filter} warnings found for ${target.user.tag}`
      );
    }

    // Sort by timestamp (newest first)
    warns.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Pagination setup
    const itemsPerPage = 5;
    const totalPages = Math.ceil(warns.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = async page => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageWarns = warns.slice(start, end);

      const activeCount = warns.filter(w => w.active !== false).length;
      const decayedCount = warns.filter(w => w.active === false).length;
      const appealedCount = warns.filter(w => w.appealed).length;

      const embed = new EmbedBuilder()
        .setColor(activeCount > 5 ? 0xff0000 : activeCount > 2 ? 0xffa500 : 0xffff00)
        .setTitle(`📋 Moderation History: ${target.user.tag}`)
        .setDescription(
          `**Filter:** ${filter.charAt(0).toUpperCase() + filter.slice(1)}\n` +
            `**Total Infractions:** ${warns.length}\n` +
            `**Active:** ${activeCount} | **Decayed:** ${decayedCount} | **Appealed:** ${appealedCount}\n\u200b`
        )
        .setThumbnail(target.user.displayAvatarURL());

      for (const warn of pageWarns) {
        const moderator = warn.moderator?.tag || 'Unknown';
        const status = [];
        if (warn.active === false) status.push('🔵 Decayed');
        if (warn.appealed) status.push(`⚠️ Appealed (${warn.appealStatus || 'Pending'})`);
        if (warn.active !== false && !warn.appealed) status.push('🔴 Active');

        embed.addFields({
          name: `Case ${warn.caseId || 'Unknown'} - <t:${Math.floor((warn.timestamp || Date.now()) / 1000)}:R>`,
          value:
            `**Status:** ${status.join(' | ')}\n` +
            `**Moderator:** ${moderator}\n` +
            `**Reason:** ${warn.reason || 'No reason provided'}\n` +
            `**Server:** ${message.guild.name}`,
          inline: false,
        });
      }

      embed.setFooter({
        text: `Page ${page + 1}/${totalPages} | Use buttons to navigate | Case ID format: W[timestamp]-[user]`,
      });
      embed.setTimestamp();

      return embed;
    };

    const generateButtons = page => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('page')
          .setLabel(`${page + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );
    };

    const embed = await generateEmbed(currentPage);
    const components =
      totalPages > 1 ? [generateButtons(currentPage)] : [];

    const reply = await message.reply({
      embeds: [embed],
      components,
    });

    if (totalPages <= 1) return;

    const collector = reply.createMessageComponentCollector({
      time: 300000, // 5 minutes
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: '❌ Only the command user can use these buttons!',
          ephemeral: true,
        });
      }

      switch (interaction.customId) {
        case 'first':
          currentPage = 0;
          break;
        case 'prev':
          currentPage = Math.max(0, currentPage - 1);
          break;
        case 'next':
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case 'last':
          currentPage = totalPages - 1;
          break;
      }

      await interaction.update({
        embeds: [await generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });
    });

    collector.on('end', () => {
      reply
        .edit({
          components: [],
        })
        .catch(() => {});
    });
  },
};
