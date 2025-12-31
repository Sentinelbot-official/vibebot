const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'dice',
  aliases: ['roll', 'd'],
  description: 'Roll dice',
  usage: '[NdN] (e.g. 2d6, 1d20)',
  category: 'fun',
  cooldown: 2,
  execute(message, args) {
    let dice = '1d6';
    if (args[0]) {
      dice = args[0].toLowerCase();
    }

    const match = dice.match(/^(\d+)d(\d+)$/);
    if (!match) {
      return message.reply('❌ Invalid format! Use: `NdN` (e.g. 2d6, 1d20)');
    }

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);

    if (count < 1 || count > 100) {
      return message.reply('❌ Number of dice must be between 1 and 100!');
    }

    if (sides < 2 || sides > 1000) {
      return message.reply('❌ Number of sides must be between 2 and 1000!');
    }

    const rolls = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`🎲 Rolling ${dice}`)
      .addFields(
        { name: 'Rolls', value: rolls.join(', '), inline: false },
        { name: 'Total', value: total.toString(), inline: true }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
