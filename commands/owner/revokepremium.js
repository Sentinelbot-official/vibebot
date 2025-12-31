const premium = require('../../utils/premium');

module.exports = {
  name: 'revokepremium',
  description: 'Revoke premium/VIP from a server',
  usage: '//revokepremium <server_id>',
  category: 'owner',
  ownerOnly: true,
  async execute(message, args) {
    if (!args[0]) {
      return message.reply('❌ Usage: `//revokepremium <server_id>`');
    }

    const guildId = args[0];

    // Check if server has premium
    const premiumData = premium.getServerPremium(guildId);
    if (!premiumData) {
      return message.reply('❌ This server does not have premium/VIP!');
    }

    // Revoke it
    const success = premium.revokePremium(guildId);

    if (success) {
      const guild = message.client.guilds.cache.get(guildId);
      const guildName = guild ? guild.name : 'Unknown Server';

      return message.reply(
        `✅ Successfully revoked **${premiumData.tier.toUpperCase()}** from **${guildName}** (\`${guildId}\`)`
      );
    } else {
      return message.reply('❌ Failed to revoke premium. Check logs for details.');
    }
  },
};
