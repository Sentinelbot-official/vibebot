const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'binary',
  description: 'Convert text to/from binary',
  usage: '<encode|decode> <text>',
  aliases: ['bin'],
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `binary <encode|decode> <text>`\n' +
          'Example: `binary encode hello` or `binary decode 01101000 01100101`'
      );
    }

    const action = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    let result;

    if (action === 'encode') {
      result = text
        .split('')
        .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(' ');
    } else if (action === 'decode') {
      try {
        result = text
          .split(' ')
          .map(binary => String.fromCharCode(parseInt(binary, 2)))
          .join('');
      } catch (error) {
        return message.reply('❌ Invalid binary code!');
      }
    } else {
      return message.reply('❌ Action must be either `encode` or `decode`!');
    }

    if (result.length > 1024) {
      return message.reply('❌ Result is too long to display!');
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('🔢 Binary Converter')
      .addFields(
        {
          name: action === 'encode' ? 'Text' : 'Binary',
          value: text.substring(0, 1024),
          inline: false,
        },
        {
          name: action === 'encode' ? 'Binary' : 'Text',
          value: result.substring(0, 1024),
          inline: false,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
