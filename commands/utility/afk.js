const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'afk',
  description: 'Set yourself as AFK',
  usage: '[reason]',
  category: 'utility',
  cooldown: 3,
  execute(message, args) {
    const reason = args.join(' ') || 'AFK';

    const afkData = {
      reason,
      since: Date.now(),
    };

    db.set('afk', message.author.id, afkData);
    message.reply(`✅ You are now AFK: ${reason}`);
  },
};
