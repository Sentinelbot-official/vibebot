const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'reverse',
  description: 'Reverse text',
  usage: '<text>',
  aliases: ['rev', 'backwards'],
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Usage: `reverse <text>`');
    }

    const text = args.join(' ');
    const reversed = text.split('').reverse().join('');

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔄 Text Reverser')
      .addFields(
        {
          name: 'Original',
          value: text.substring(0, 1024),
          inline: false,
        },
        {
          name: 'Reversed',
          value: reversed.substring(0, 1024),
          inline: false,
        }
      )
      .setFooter({ text: `Reversed by ${message.author.tag}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
