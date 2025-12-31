const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const branding = require('../../utils/branding');

module.exports = {
  name: 'servers',
  aliases: ['guilds', 'serverlist'],
  description: 'List all servers the bot is in (Owner Only)',
  usage: '[page]',
  category: 'owner',
  ownerOnly: true,
  cooldown: 0,
  execute(message, args) {
    const guilds = message.client.guilds.cache.sort(
      (a, b) => b.memberCount - a.memberCount
    );

    const page = parseInt(args[0]) || 1;
    const perPage = 10;
    const maxPages = Math.ceil(guilds.size / perPage);

    if (page < 1 || page > maxPages) {
      return message.reply(
        `❌ Invalid page number! Please use a page between 1 and ${maxPages}.`
      );
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;

    const guildList = Array.from(guilds.values())
      .slice(start, end)
      .map((guild, index) => {
        const owner = guild.members.cache.get(guild.ownerId);
        return (
          `**${start + index + 1}.** ${guild.name}\n` +
          `└ ID: \`${guild.id}\`\n` +
          `└ Owner: ${owner ? owner.user.tag : 'Unknown'}\n` +
          `└ Members: ${guild.memberCount} | Channels: ${guild.channels.cache.size} | Roles: ${guild.roles.cache.size}`
        );
      })
      .join('\n\n');

    const totalMembers = guilds.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🔴 Server List')
      .setDescription(
        `**Total Servers:** ${guilds.size}\n` +
          `**Total Members:** ${totalMembers.toLocaleString()}\n` +
          `**Page:** ${page}/${maxPages}\n\n` +
          guildList
      )
      .setFooter({
        text: `🔴 Owner Command | Page ${page}/${maxPages}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });

    logger.info(`Server list viewed by ${message.author.tag} (page ${page})`);
  },
};
