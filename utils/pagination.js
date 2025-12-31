const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

/**
 * Create a paginated embed message
 * @param {Message} message - The message object
 * @param {Array<EmbedBuilder>} embeds - Array of embeds to paginate
 * @param {Object} options - Pagination options
 * @returns {Promise<void>}
 */
async function paginate(message, embeds, options = {}) {
  const {
    time = 60000, // 1 minute default
    showPageNumber = true,
    ephemeral = false,
  } = options;

  if (embeds.length === 0) {
    return message.reply('No pages to display.');
  }

  if (embeds.length === 1) {
    return message.reply({ embeds: [embeds[0]] });
  }

  let currentPage = 0;

  const getButtons = disabled => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('first')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === 0),
      new ButtonBuilder()
        .setCustomId('previous')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === 0),
      new ButtonBuilder()
        .setCustomId('stop')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId('next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === embeds.length - 1),
      new ButtonBuilder()
        .setCustomId('last')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === embeds.length - 1)
    );
  };

  const updateEmbed = () => {
    const embed = embeds[currentPage];
    if (showPageNumber) {
      embed.setFooter({
        text: `Page ${currentPage + 1} of ${embeds.length} | ${embed.data.footer?.text || ''}`,
      });
    }
    return embed;
  };

  const reply = await message.reply({
    embeds: [updateEmbed()],
    components: [getButtons(false)],
    fetchReply: true,
  });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.user.id === message.author.id,
    time,
  });

  collector.on('collect', async interaction => {
    switch (interaction.customId) {
      case 'first':
        currentPage = 0;
        break;
      case 'previous':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'next':
        currentPage = Math.min(embeds.length - 1, currentPage + 1);
        break;
      case 'last':
        currentPage = embeds.length - 1;
        break;
      case 'stop':
        collector.stop();
        return;
    }

    await interaction.update({
      embeds: [updateEmbed()],
      components: [getButtons(false)],
    });
  });

  collector.on('end', () => {
    reply
      .edit({
        components: [getButtons(true)],
      })
      .catch(() => {});
  });
}

/**
 * Split an array into chunks for pagination
 * @param {Array} array - Array to split
 * @param {number} size - Size of each chunk
 * @returns {Array<Array>}
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

module.exports = { paginate, chunkArray };
