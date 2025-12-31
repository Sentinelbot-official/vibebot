const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'json',
  aliases: ['jsonformat', 'prettyjson'],
  description: 'Format and validate JSON',
  usage: '<json>',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Please provide JSON to format!');
    }

    const input = args.join(' ');

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);

      if (formatted.length > 1900) {
        return message.reply(
          '❌ JSON is too long to display! (Max 1900 characters)'
        );
      }

      message.reply(`\`\`\`json\n${formatted}\n\`\`\``);
    } catch (error) {
      message.reply(`❌ Invalid JSON!\n\`\`\`\n${error.message}\n\`\`\``);
    }
  },
};
