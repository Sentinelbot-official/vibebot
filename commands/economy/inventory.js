const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'inventory',
  aliases: ['inv', 'items', 'bag'],
  description: 'View your inventory with detailed item information',
  usage: '[@user]',
  category: 'economy',
  cooldown: 3,
  guildOnly: true,
  async execute(message, _args) {
    const user = message.mentions.users.first() || message.author;
    const inventory = db.get('inventory', user.id) || {};
    const guildInv = inventory[message.guild.id] || {};

    if (Object.keys(guildInv).length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(0x808080)
        .setAuthor({
          name: `${user.username}'s Inventory`,
          iconURL: user.displayAvatarURL(),
        })
        .setDescription(
          `${user.id === message.author.id ? '🎒 Your inventory is empty!' : `🎒 ${user.username}'s inventory is empty!`}\n\n` +
            `${user.id === message.author.id ? 'Use `//shop` to buy items!' : ''}`
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      return message.reply({ embeds: [emptyEmbed] });
    }

    // Categorize items
    const items = Object.entries(guildInv).map(([itemId, item]) => ({
      id: itemId,
      ...item,
      category: item.category || 'Other',
      value: item.price || 0,
    }));

    const categories = {
      Tools: items.filter(i => i.category === 'Tools'),
      Collectibles: items.filter(i => i.category === 'Collectibles'),
      Consumables: items.filter(i => i.category === 'Consumables'),
      Premium: items.filter(i => i.category === 'Premium'),
      Other: items.filter(
        i =>
          !['Tools', 'Collectibles', 'Consumables', 'Premium'].includes(
            i.category
          )
      ),
    };

    // Calculate total value and count
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce(
      (sum, item) => sum + item.value * item.quantity,
      0
    );
    const uniqueItems = items.length;

    // Pagination
    const itemsPerPage = 8;
    let currentPage = 0;
    const allItems = items.sort(
      (a, b) => b.value * b.quantity - a.value * a.quantity
    );
    const totalPages = Math.ceil(allItems.length / itemsPerPage);

    const generateEmbed = page => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = allItems.slice(start, end);

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setAuthor({
          name: `${user.username}'s Inventory`,
          iconURL: user.displayAvatarURL(),
        })
        .setThumbnail(user.displayAvatarURL())
        .setDescription(
          `**Total Items:** ${totalItems.toLocaleString()} (${uniqueItems} unique)\n` +
            `**Total Value:** ${totalValue.toLocaleString()} coins\n` +
            `**Capacity:** ${totalItems}/∞\n\u200b`
        );

      // Group items by category for this page
      const pageCategories = {};
      pageItems.forEach(item => {
        if (!pageCategories[item.category]) {
          pageCategories[item.category] = [];
        }
        pageCategories[item.category].push(item);
      });

      // Add fields for each category
      for (const [category, categoryItems] of Object.entries(pageCategories)) {
        if (categoryItems.length > 0) {
          const categoryEmoji = {
            Tools: '🔧',
            Collectibles: '🎨',
            Consumables: '🍎',
            Premium: '💎',
            Other: '📦',
          };

          const itemList = categoryItems
            .map(item => {
              const rarity = item.rarity ? ` [${item.rarity}]` : '';
              const itemValue =
                item.value > 0
                  ? ` (${(item.value * item.quantity).toLocaleString()} coins)`
                  : '';
              return `**${item.name}** x${item.quantity}${rarity}${itemValue}\n*${item.description || 'No description'}*`;
            })
            .join('\n\n');

          embed.addFields({
            name: `${categoryEmoji[category] || '📦'} ${category}`,
            value: itemList,
            inline: false,
          });
        }
      }

      embed.setFooter({
        text: `Page ${page + 1}/${totalPages} | Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      });
      embed.setTimestamp();

      return embed;
    };

    const embed = generateEmbed(currentPage);

    if (totalPages <= 1) {
      return message.reply({ embeds: [embed] });
    }

    // Create pagination buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('inv_first')
        .setLabel('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId('inv_prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId('inv_page')
        .setLabel(`${currentPage + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('inv_next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages - 1),
      new ButtonBuilder()
        .setCustomId('inv_last')
        .setLabel('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages - 1)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    // Button collector
    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async i => {
      if (i.customId === 'inv_first') currentPage = 0;
      else if (i.customId === 'inv_prev')
        currentPage = Math.max(0, currentPage - 1);
      else if (i.customId === 'inv_next')
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      else if (i.customId === 'inv_last') currentPage = totalPages - 1;

      const newEmbed = generateEmbed(currentPage);
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('inv_first')
          .setLabel('⏮️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('inv_prev')
          .setLabel('◀️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('inv_page')
          .setLabel(`${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('inv_next')
          .setLabel('▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1),
        new ButtonBuilder()
          .setCustomId('inv_last')
          .setLabel('⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1)
      );

      await i.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('inv_first')
          .setLabel('⏮️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('inv_prev')
          .setLabel('◀️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('inv_page')
          .setLabel(`${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('inv_next')
          .setLabel('▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('inv_last')
          .setLabel('⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      msg.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};
