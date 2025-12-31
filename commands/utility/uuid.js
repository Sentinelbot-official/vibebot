const crypto = require('crypto');

module.exports = {
  name: 'uuid',
  aliases: ['guid'],
  description: 'Generate a random UUID',
  category: 'utility',
  cooldown: 3,
  execute(message, args) {
    const count = Math.min(parseInt(args[0]) || 1, 10);

    const uuids = [];
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }

    message.reply(`\`\`\`\n${uuids.join('\n')}\n\`\`\``);
  },
};
