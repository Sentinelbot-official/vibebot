const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');
const branding = require('../../utils/branding');

module.exports = {
  name: 'listkeys',
  description: 'List all activation keys',
  usage: '//listkeys',
  category: 'owner',
  ownerOnly: true,
  async execute(message) {
    const keys = premium.getAllKeys();

    if (keys.length === 0) {
      return message.reply('📝 No activation keys have been generated yet.');
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🔑 Activation Keys')
      .setDescription(`Total keys: **${keys.length}**`)
      .setTimestamp();

    // Show first 10 keys
    const displayKeys = keys.slice(0, 10);

    for (const keyData of displayKeys) {
      const tierEmoji = keyData.tier === 'vip' ? '👑' : '✨';
      const usageInfo =
        keyData.maxUses > 0
          ? `${keyData.uses}/${keyData.maxUses} uses`
          : `${keyData.uses} uses (unlimited)`;
      const expiryInfo =
        keyData.expiresAt > 0
          ? `Expires <t:${Math.floor(keyData.expiresAt / 1000)}:R>`
          : 'Never expires';

      // Get guild info if bound
      let guildInfo = 'Any server';
      if (keyData.boundToGuild) {
        const guild = message.client.guilds.cache.get(keyData.boundToGuild);
        guildInfo = guild
          ? `🏰 ${guild.name}`
          : `🏰 Guild ID: ${keyData.boundToGuild}`;
      }

      embed.addFields({
        name: `${tierEmoji} ${keyData.key}`,
        value: `**Tier:** ${keyData.tier.toUpperCase()}\n**Usage:** ${usageInfo}\n**Status:** ${expiryInfo}\n**Bound to:** ${guildInfo}`,
        inline: false,
      });
    }

    if (keys.length > 10) {
      embed.setFooter({
        text: `Showing 10 of ${keys.length} keys. Use //listservers to see premium servers.`,
      });
    }

    return message.reply({ embeds: [embed] });
  },
};
