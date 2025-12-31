module.exports = {
  name: 'base64',
  aliases: ['b64'],
  description: 'Encode or decode base64',
  usage: '<encode|decode> <text>',
  category: 'utility',
  cooldown: 3,
  execute(message, args) {
    if (args.length < 2) {
      return message.reply('❌ Usage: `!base64 <encode|decode> <text>`');
    }

    const action = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    try {
      if (action === 'encode' || action === 'e') {
        const encoded = Buffer.from(text).toString('base64');
        message.reply(`\`\`\`\n${encoded}\n\`\`\``);
      } else if (action === 'decode' || action === 'd') {
        const decoded = Buffer.from(text, 'base64').toString('utf-8');
        message.reply(`\`\`\`\n${decoded}\n\`\`\``);
      } else {
        message.reply('❌ Invalid action! Use `encode` or `decode`');
      }
    } catch (error) {
      message.reply('❌ Failed to process! Make sure your input is valid.');
    }
  },
};
