const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const recipes = {
  sword: { name: 'Iron Sword', materials: { iron: 3, wood: 1 }, emoji: '⚔️' },
  shield: { name: 'Wooden Shield', materials: { wood: 5 }, emoji: '🛡️' },
  potion: {
    name: 'Health Potion',
    materials: { herb: 2, water: 1 },
    emoji: '🧪',
  },
  armor: { name: 'Iron Armor', materials: { iron: 5 }, emoji: '🛡️' },
};

module.exports = {
  name: 'craft',
  description: 'Craft items from materials',
  usage: '[recipe/list]',
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'list') {
      const recipeList = Object.entries(recipes)
        .map(([key, recipe]) => {
          const materials = Object.entries(recipe.materials)
            .map(([mat, qty]) => `${qty}x ${mat}`)
            .join(', ');
          return `${recipe.emoji} **${recipe.name}** - ${materials}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🔨 Crafting Recipes')
        .setDescription(recipeList)
        .setFooter({ text: 'Use "craft <recipe>" to craft' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const recipe = recipes[action];
    if (!recipe) {
      return message.reply('❌ Invalid recipe! Use `craft list`');
    }

    const inventory = db.get('inventory', message.author.id) || [];

    for (const [material, quantity] of Object.entries(recipe.materials)) {
      const count = inventory.filter(item => item.name === material).length;
      if (count < quantity) {
        return message.reply(
          `❌ Need ${quantity}x ${material}, have ${count}!`
        );
      }
    }

    for (const [material, quantity] of Object.entries(recipe.materials)) {
      for (let i = 0; i < quantity; i++) {
        const index = inventory.findIndex(item => item.name === material);
        if (index !== -1) inventory.splice(index, 1);
      }
    }

    inventory.push({ name: action, craftedAt: Date.now() });
    db.set('inventory', message.author.id, inventory);

    return message.reply(`✅ Crafted **${recipe.name}**! ${recipe.emoji}`);
  },
};
