const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const properties = {
  apartment: { name: 'Apartment', price: 10000, income: 100, emoji: '🏢' },
  house: { name: 'House', price: 50000, income: 500, emoji: '🏠' },
  mansion: { name: 'Mansion', price: 200000, income: 2000, emoji: '🏰' },
  skyscraper: {
    name: 'Skyscraper',
    price: 1000000,
    income: 10000,
    emoji: '🏙️',
  },
};

module.exports = {
  name: 'property',
  description: 'Buy properties to earn passive income',
  usage: '[buy/sell/list/collect]',
  aliases: ['prop', 'estate'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    const userData = db.get('properties', message.author.id) || {
      owned: [],
      lastCollect: 0,
    };

    if (!action || action === 'list') {
      const propList = Object.entries(properties)
        .map(([key, prop]) => {
          const owned = userData.owned.filter(p => p === key).length;
          return `${prop.emoji} **${prop.name}** - ${prop.price.toLocaleString()} coins (Income: ${prop.income}/day) ${owned > 0 ? `[Owned: ${owned}]` : ''}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🏘️ Properties')
        .setDescription(propList)
        .setFooter({ text: 'Use "property buy <name>" to purchase' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'buy') {
      const propName = args[1]?.toLowerCase();
      if (!propName || !properties[propName]) {
        return message.reply(
          '❌ Invalid property! Use `property list` to see available properties.'
        );
      }

      const prop = properties[propName];
      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };

      if (economy.coins < prop.price) {
        return message.reply(
          `❌ You need ${prop.price.toLocaleString()} coins! You have ${economy.coins.toLocaleString()}.`
        );
      }

      economy.coins -= prop.price;
      db.set('economy', message.author.id, economy);

      userData.owned.push(propName);
      db.set('properties', message.author.id, userData);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Property Purchased!')
        .setDescription(`You bought a **${prop.name}**!`)
        .addFields(
          {
            name: '💰 Price',
            value: `${prop.price.toLocaleString()} coins`,
            inline: true,
          },
          {
            name: '📈 Daily Income',
            value: `${prop.income} coins`,
            inline: true,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'collect') {
      if (userData.owned.length === 0) {
        return message.reply("❌ You don't own any properties!");
      }

      const now = Date.now();
      const lastCollect = userData.lastCollect || 0;
      const timeSince = now - lastCollect;
      const daysSince = timeSince / (1000 * 60 * 60 * 24);

      if (daysSince < 1) {
        const hoursLeft = Math.ceil((1 - daysSince) * 24);
        return message.reply(`❌ You can collect again in ${hoursLeft} hours!`);
      }

      let totalIncome = 0;
      userData.owned.forEach(propName => {
        totalIncome += properties[propName].income;
      });

      const economy = db.get('economy', message.author.id) || {
        coins: 0,
        bank: 0,
      };
      economy.coins += totalIncome;
      db.set('economy', message.author.id, economy);

      userData.lastCollect = now;
      db.set('properties', message.author.id, userData);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('💰 Income Collected!')
        .setDescription(
          `You collected **${totalIncome.toLocaleString()}** coins from your properties!`
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply('❌ Usage: `property [buy/sell/list/collect]`');
  },
};
