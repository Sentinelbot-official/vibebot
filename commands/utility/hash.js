const crypto = require('crypto');

module.exports = {
  name: 'hash',
  description: 'Generate hash of text (MD5, SHA256, etc.)',
  usage: '<algorithm> <text>',
  category: 'utility',
  cooldown: 3,
  execute(message, args) {
    if (args.length < 2) {
      return message.reply('❌ Usage: `!hash <md5|sha256|sha512> <text>`');
    }

    const algorithm = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    const validAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];

    if (!validAlgorithms.includes(algorithm)) {
      return message.reply(
        `❌ Invalid algorithm! Use: ${validAlgorithms.join(', ')}`
      );
    }

    try {
      const hash = crypto.createHash(algorithm).update(text).digest('hex');
      message.reply(`\`\`\`\n${algorithm.toUpperCase()}: ${hash}\n\`\`\``);
    } catch (error) {
      message.reply('❌ Failed to generate hash!');
    }
  },
};
