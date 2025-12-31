const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'buy',
  aliases: ['purchase'],
  description: 'Buy an item from the shop',
  usage: '<itemId> [amount]',
  category: 'economy',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!args[0]) {
      return message.reply(
        '❌ Please specify an item ID! Use `!shop` to see items.'
      );
    }

    const itemId = args[0].toLowerCase();
    const amount = parseInt(args[1]) || 1;

    if (amount < 1 || amount > 100) {
      return message.reply('❌ Amount must be between 1 and 100!');
    }

    const shopItems = db.get('shop', message.guild.id) || {};
    const item = shopItems[itemId];

    if (!item) {
      return message.reply(
        '❌ Item not found! Use `!shop` to see available items.'
      );
    }

    // Check stock
    if (item.stock !== -1 && item.stock < amount) {
      return message.reply(
        `❌ Not enough stock! Only ${item.stock} available.`
      );
    }

    const totalPrice = item.price * amount;

    // Get user economy
    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    if (economy.coins < totalPrice) {
      return message.reply(
        `❌ You don't have enough coins! You need ${totalPrice.toLocaleString()} coins.`
      );
    }

    // Deduct coins
    economy.coins -= totalPrice;
    db.set('economy', message.author.id, economy);

    // Update stock
    if (item.stock !== -1) {
      item.stock -= amount;
      db.set('shop', message.guild.id, shopItems);
    }

    // Add to inventory
    const inventory = db.get('inventory', message.author.id) || {};
    const userGuildInv = inventory[message.guild.id] || {};

    if (!userGuildInv[itemId]) {
      userGuildInv[itemId] = { ...item, quantity: 0 };
    }
    userGuildInv[itemId].quantity += amount;

    inventory[message.guild.id] = userGuildInv;
    db.set('inventory', message.author.id, inventory);

    // Handle role items
    if (item.type === 'role' && item.roleId) {
      const role = message.guild.roles.cache.get(item.roleId);
      if (role) {
        await message.member.roles.add(role).catch(() => {});
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Purchase Successful!')
      .setDescription(
        `You bought **${amount}x ${item.name}** for **${totalPrice.toLocaleString()} coins**!`
      )
      .addFields({
        name: '💰 New Balance',
        value: `${economy.coins.toLocaleString()} coins`,
        inline: true,
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
