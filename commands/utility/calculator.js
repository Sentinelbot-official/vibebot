const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'calculator',
  description: 'Calculate a mathematical expression',
  usage: '<expression>',
  aliases: ['calc', 'math'],
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply(
        '❌ Usage: `calculator <expression>`\n' +
          'Example: `calculator 2 + 2` or `calc 5 * 10`'
      );
    }

    const expression = args.join(' ');

    // Sanitize input - only allow numbers and basic operators
    const sanitized = expression.replace(/[^0-9+\-*/().% ]/g, '');

    if (sanitized !== expression) {
      return message.reply(
        '❌ Invalid expression! Only numbers and operators (+, -, *, /, %, parentheses) are allowed.'
      );
    }

    try {
      // Evaluate the expression safely
      const result = Function(`"use strict"; return (${sanitized})`)();

      if (!isFinite(result)) {
        return message.reply('❌ Result is not a finite number!');
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🔢 Calculator')
        .addFields(
          {
            name: 'Expression',
            value: `\`${expression}\``,
            inline: false,
          },
          {
            name: 'Result',
            value: `\`${result}\``,
            inline: false,
          }
        )
        .setFooter({ text: `Calculated by ${message.author.tag}` })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      message.reply('❌ Invalid mathematical expression!');
    }
  },
};
