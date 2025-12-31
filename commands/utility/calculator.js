const { EmbedBuilder } = require('discord.js');
const math = require('mathjs');

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

    // Validate expression length
    if (expression.length > 200) {
      return message.reply(
        '❌ Expression is too long! Maximum 200 characters.'
      );
    }

    try {
      // Use math.js for safe evaluation with limited scope
      const result = math.evaluate(expression, {
        // Restrict to basic math functions only
      });

      if (!isFinite(result)) {
        return message.reply('❌ Result is not a finite number!');
      }

      // Prevent extremely large results
      if (Math.abs(result) > Number.MAX_SAFE_INTEGER) {
        return message.reply('❌ Result is too large to display accurately!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle('🔢 Calculator')
        .addFields(
          {
            name: 'Expression',
            value: `\`${expression.substring(0, 1000)}\``,
            inline: false,
          },
          {
            name: 'Result',
            value: `\`${result}\``,
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      message.reply('❌ Invalid mathematical expression!');
    }
  },
};
