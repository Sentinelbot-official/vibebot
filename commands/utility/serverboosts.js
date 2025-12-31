const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'serverboosts',
  aliases: ['boosts', 'boosters'],
  description: 'Show server boost information',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  execute(message, args) {
    const guild = message.guild;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostTier = guild.premiumTier;
    const boosters = guild.members.cache.filter(m => m.premiumSince);

    const tierNames = {
      0: 'No Level',
      1: 'Level 1',
      2: 'Level 2',
      3: 'Level 3',
    };

    const embed = new EmbedBuilder()
      .setColor(0xff73fa)
      .setTitle(`💎 ${guild.name} Boosts`)
      .addFields(
        { name: 'Boost Tier', value: tierNames[boostTier], inline: true },
        { name: 'Total Boosts', value: `${boostCount}`, inline: true },
        { name: 'Boosters', value: `${boosters.size}`, inline: true }
      );

    if (boosters.size > 0 && boosters.size <= 20) {
      const boosterList = boosters.map(m => `${m.user.tag}`).join('\n');
      embed.addFields({
        name: 'Server Boosters',
        value: boosterList,
        inline: false,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
