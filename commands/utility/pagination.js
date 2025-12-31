const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: 'pagination',
  description: 'Improved pagination with buttons',
  category: 'utility',
  cooldown: 5,
  async execute(message) {
    const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
    await createPagination(message, items, 10, 'Example Pagination');
  },
};

async function createPagination(message, items, itemsPerPage, title) {
  let currentPage = 0;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const generateEmbed = page => {
    const start = page * itemsPerPage;
    const pageItems = items.slice(start, start + itemsPerPage);
    return new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(title)
      .setDescription(pageItems.join('\n'))
      .setFooter({ text: `Page ${page + 1}/${totalPages}` })
      .setTimestamp();
  };

  const generateButtons = page => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('page_first')
        .setLabel('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('page_prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('page_next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages - 1),
      new ButtonBuilder()
        .setCustomId('page_last')
        .setLabel('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages - 1)
    );
  };

  const msg = await message.reply({
    embeds: [generateEmbed(currentPage)],
    components: [generateButtons(currentPage)],
  });

  const collector = msg.createMessageComponentCollector({ time: 300000 });

  collector.on('collect', async i => {
    if (i.user.id !== message.author.id) {
      return i.reply({
        content: '❌ Not your pagination!',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (i.customId === 'page_first') currentPage = 0;
    else if (i.customId === 'page_prev') currentPage--;
    else if (i.customId === 'page_next') currentPage++;
    else if (i.customId === 'page_last') currentPage = totalPages - 1;

    await i.update({
      embeds: [generateEmbed(currentPage)],
      components: [generateButtons(currentPage)],
    });
  });

  collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
}

module.exports.createPagination = createPagination;
