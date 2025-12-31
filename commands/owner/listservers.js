const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');

module.exports = {
  name: 'listservers',
  description: 'List all servers with premium/VIP',
  usage: '//listservers',
  category: 'owner',
  ownerOnly: true,
  async execute(message) {
    const servers = premium.getAllPremiumServers();

    if (servers.length === 0) {
      return message.reply('📝 No servers have premium/VIP activated yet.');
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('💎 Premium Servers')
      .setDescription(`Total premium servers: **${servers.length}**`)
      .setTimestamp();

    // Count tiers
    const premiumCount = servers.filter(s => s.tier === 'premium').length;
    const vipCount = servers.filter(s => s.tier === 'vip').length;

    embed.addFields({
      name: '📊 Breakdown',
      value: `✨ Premium: **${premiumCount}**\n👑 VIP: **${vipCount}**`,
      inline: false,
    });

    // Show first 10 servers
    const displayServers = servers.slice(0, 10);

    for (const serverData of displayServers) {
      const guild = message.client.guilds.cache.get(serverData.guildId);
      const guildName = guild ? guild.name : 'Unknown Server';
      const tierEmoji = serverData.tier === 'vip' ? '👑' : '✨';
      const expiryInfo =
        serverData.expiresAt > 0
          ? `Expires <t:${Math.floor(serverData.expiresAt / 1000)}:R>`
          : 'Lifetime';

      embed.addFields({
        name: `${tierEmoji} ${guildName}`,
        value:
          `**ID:** ${serverData.guildId}\n` +
          `**Tier:** ${serverData.tier.toUpperCase()}\n` +
          `**Status:** ${expiryInfo}\n` +
          `**Key:** \`${serverData.activationKey}\``,
        inline: false,
      });
    }

    if (servers.length > 10) {
      embed.setFooter({
        text: `Showing 10 of ${servers.length} premium servers.`,
      });
    }

    return message.reply({ embeds: [embed] });
  },
};
