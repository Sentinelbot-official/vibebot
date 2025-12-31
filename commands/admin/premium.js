const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'premium',
  description: 'Manage premium/VIP status',
  usage: '<add/remove/list> [@user]',
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      const premium = db.get('premium', message.author.id);

      if (!premium || premium.expiresAt < Date.now()) {
        return message.reply(
          "❌ You don't have premium! Contact admins for info."
        );
      }

      const daysLeft = Math.ceil(
        (premium.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return message.reply(`💎 Premium active! ${daysLeft} days left.`);
    }

    const action = args[0]?.toLowerCase();

    if (action === 'add') {
      const user = message.mentions.users.first();
      const days = parseInt(args[2]) || 30;
      if (!user) return message.reply('❌ Mention a user!');

      db.set('premium', user.id, {
        grantedBy: message.author.id,
        grantedAt: Date.now(),
        expiresAt: Date.now() + days * 24 * 60 * 60 * 1000,
      });

      return message.reply(`✅ Granted premium to ${user} for ${days} days!`);
    }

    if (action === 'remove') {
      const user = message.mentions.users.first();
      if (!user) return message.reply('❌ Mention a user!');
      db.delete('premium', user.id);
      return message.reply(`✅ Removed premium from ${user}!`);
    }

    if (action === 'list') {
      const allPremium = db.all('premium');
      if (!allPremium || Object.keys(allPremium).length === 0) {
        return message.reply('❌ No premium members!');
      }

      const list = Object.entries(allPremium)
        .filter(([_, data]) => data.expiresAt > Date.now())
        .map(([userId]) => `<@${userId}>`)
        .join(', ');

      return message.reply(`💎 Premium members: ${list || 'None'}`);
    }

    return message.reply('❌ Usage: `premium <add/remove/list>`');
  },
};
