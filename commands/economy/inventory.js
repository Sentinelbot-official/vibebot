const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'inventory',
  aliases: ['inv', 'items'],
  description: 'View your inventory',
  usage: '[@user]',
  category: 'economy',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const inventory = db.get('inventory', user.id) || {};
    const guildInv = inventory[message.guild.id] || {};

    if (Object.keys(guildInv).length === 0) {
      return message.reply(
        `${user.id === message.author.id ? 'You have' : `${user.username} has`} no items!`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setAuthor({
        name: `${user.username}'s Inventory`,
        iconURL: user.displayAvatarURL(),
      })
      .setTimestamp();

    let description = '';
    for (const [itemId, item] of Object.entries(guildInv)) {
      description += `**${item.name}** x${item.quantity}\n${item.description}\n\n`;
    }

    embed.setDescription(description || 'No items');
    message.reply({ embeds: [embed] });
  },
};
