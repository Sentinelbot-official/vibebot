const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const musicManager = require('../../utils/musicManager');
const branding = require('../../utils/branding');

module.exports = {
  name: 'queue',
  aliases: ['q', 'list'],
  description: 'Show the current music queue',
  usage: '[page]',
  category: 'music',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const queue = musicManager.getQueue(message.guild.id);

    if (!queue.voiceChannel || queue.songs.length === 0) {
      return message.reply('❌ The queue is empty! Use `//play` to add songs.');
    }

    const songsPerPage = 10;
    const totalPages = Math.ceil(queue.songs.length / songsPerPage);
    let currentPage = parseInt(args[0]) || 1;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * songsPerPage;
    const end = start + songsPerPage;
    const pageSongs = queue.songs.slice(start, end);

    // Calculate total duration
    let totalDuration = 0;
    for (const song of queue.songs) {
      const parts = song.duration.split(':');
      if (parts.length === 2) {
        totalDuration += parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        totalDuration +=
          parseInt(parts[0]) * 3600 +
          parseInt(parts[1]) * 60 +
          parseInt(parts[2]);
      }
    }

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const totalDurationStr =
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🎵 Music Queue')
      .setDescription(
        `**Now Playing:**\n` +
          `[${queue.songs[0].title}](${queue.songs[0].url})\n` +
          `Duration: ${queue.songs[0].duration} | Requested by: ${queue.songs[0].requester}\n\u200b`
      )
      .setThumbnail(queue.songs[0].thumbnail || '')
      .addFields({
        name: '📋 Up Next',
        value:
          pageSongs
            .slice(1)
            .map((song, i) => {
              const position = start + i + 2;
              return `**${position}.** [${song.title}](${song.url}) - \`${song.duration}\``;
            })
            .join('\n') || 'No more songs in queue',
        inline: false,
      })
      .addFields(
        {
          name: '📊 Queue Stats',
          value: `**Songs:** ${queue.songs.length}\n**Duration:** ${totalDurationStr}`,
          inline: true,
        },
        {
          name: '🔊 Settings',
          value: `**Volume:** ${queue.volume}%\n**Loop:** ${queue.loop ? '✅' : '❌'}\n**Loop Queue:** ${queue.loopQueue ? '✅' : '❌'}`,
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    // Add pagination buttons if needed
    if (totalPages > 1) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('queue_first')
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId('queue_prev')
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 1),
        new ButtonBuilder()
          .setCustomId('queue_page')
          .setLabel(`${currentPage}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('queue_next')
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages),
        new ButtonBuilder()
          .setCustomId('queue_last')
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages)
      );

      const reply = await message.reply({ embeds: [embed], components: [row] });

      const collector = reply.createMessageComponentCollector({
        time: 300000, // 5 minutes
      });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: '❌ Only the command user can use these buttons!',
            flags: MessageFlags.Ephemeral,
          });
        }

        switch (interaction.customId) {
          case 'queue_first':
            currentPage = 1;
            break;
          case 'queue_prev':
            currentPage = Math.max(1, currentPage - 1);
            break;
          case 'queue_next':
            currentPage = Math.min(totalPages, currentPage + 1);
            break;
          case 'queue_last':
            currentPage = totalPages;
            break;
        }

        // Update embed with new page
        const newStart = (currentPage - 1) * songsPerPage;
        const newEnd = newStart + songsPerPage;
        const newPageSongs = queue.songs.slice(newStart, newEnd);

        embed.data.fields[0].value =
          newPageSongs
            .slice(1)
            .map((song, i) => {
              const position = newStart + i + 2;
              return `**${position}.** [${song.title}](${song.url}) - \`${song.duration}\``;
            })
            .join('\n') || 'No more songs in queue';

        embed.setFooter(branding.footers.default);

        row.components[0].setDisabled(currentPage === 1);
        row.components[1].setDisabled(currentPage === 1);
        row.components[2].setLabel(`${currentPage}/${totalPages}`);
        row.components[3].setDisabled(currentPage === totalPages);
        row.components[4].setDisabled(currentPage === totalPages);

        await interaction.update({ embeds: [embed], components: [row] });
      });

      collector.on('end', () => {
        reply.edit({ components: [] }).catch(() => {});
      });
    } else {
      return message.reply({ embeds: [embed] });
    }
  },
};
