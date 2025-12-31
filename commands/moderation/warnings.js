const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const { paginate, chunkArray } = require('../../utils/pagination');

module.exports = {
  name: 'warnings',
  description: 'View all warnings in the server',
  usage: '[page]',
  aliases: ['allwarns', 'warnlist'],
  category: 'moderation',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You need Manage Messages permission!');
    }

    // Get all warnings for this server
    const allWarnings = [];
    const members = await message.guild.members.fetch();

    for (const [memberId, member] of members) {
      const warns = db.get('warns', memberId);
      if (warns && warns.length > 0) {
        allWarnings.push({
          user: member.user.tag,
          userId: memberId,
          count: warns.length,
          warns,
        });
      }
    }

    if (allWarnings.length === 0) {
      return message.reply('✅ No warnings found in this server!');
    }

    // Sort by warning count
    allWarnings.sort((a, b) => b.count - a.count);

    // Create embeds for pagination
    const chunks = chunkArray(allWarnings, 10);
    const embeds = chunks.map((chunk, index) => {
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('⚠️ Server Warnings')
        .setDescription(`Total users with warnings: ${allWarnings.length}`)
        .setTimestamp();

      chunk.forEach(data => {
        const warningList = data.warns
          .slice(0, 3)
          .map(
            w =>
              `\`${w.caseId}\` - ${w.reason.substring(0, 50)}${w.reason.length > 50 ? '...' : ''}`
          )
          .join('\n');

        embed.addFields({
          name: `${data.user} (${data.count} warnings)`,
          value:
            warningList + (data.count > 3 ? `\n*+${data.count - 3} more*` : ''),
          inline: false,
        });
      });

      return embed;
    });

    if (embeds.length === 1) {
      return message.reply({ embeds: [embeds[0]] });
    }

    // Use pagination for multiple pages
    await paginate(message, embeds);
  },
};
