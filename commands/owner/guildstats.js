const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'guildstats',
  aliases: ['serverstats', 'guilds'],
  description: 'View guild join/leave statistics',
  usage: '//guildstats [recent]',
  category: 'owner',
  ownerOnly: true,
  async execute(message, args) {
    const showRecent = args[0]?.toLowerCase() === 'recent';

    if (showRecent) {
      // Show recent joins and leaves
      const joins = db.getAll('guild_joins') || [];
      const leaves = db.getAll('guild_leaves') || [];

      const recentJoins = joins
        .filter(j => j.key !== 'initialized')
        .sort((a, b) => b.value.joinedAt - a.value.joinedAt)
        .slice(0, 5);

      const recentLeaves = leaves
        .filter(l => l.key !== 'initialized')
        .sort((a, b) => b.value.leftAt - a.value.leftAt)
        .slice(0, 5);

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📊 Recent Guild Activity')
        .setTimestamp();

      if (recentJoins.length > 0) {
        const joinsText = recentJoins
          .map(
            j =>
              `• **${j.value.name}** (\`${j.value.id}\`)\n  <t:${Math.floor(j.value.joinedAt / 1000)}:R> - ${j.value.memberCount} members`
          )
          .join('\n');
        embed.addFields({
          name: '✅ Recent Joins',
          value: joinsText,
          inline: false,
        });
      }

      if (recentLeaves.length > 0) {
        const leavesText = recentLeaves
          .map(
            l =>
              `• **${l.value.name}** (\`${l.value.id}\`)\n  <t:${Math.floor(l.value.leftAt / 1000)}:R> - ${l.value.timeInGuild !== 'Unknown' ? `${l.value.timeInGuild} days` : 'Unknown time'}`
          )
          .join('\n');
        embed.addFields({
          name: '❌ Recent Leaves',
          value: leavesText,
          inline: false,
        });
      }

      if (recentJoins.length === 0 && recentLeaves.length === 0) {
        embed.setDescription('No recent guild activity recorded.');
      }

      return message.reply({ embeds: [embed] });
    } else {
      // Show overall statistics
      const totalGuilds = message.client.guilds.cache.size;
      const totalMembers = message.client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      );

      const joins = db.getAll('guild_joins') || [];
      const leaves = db.getAll('guild_leaves') || [];

      const totalJoins = joins.filter(j => j.key !== 'initialized').length;
      const totalLeaves = leaves.filter(l => l.key !== 'initialized').length;

      // Calculate joins/leaves in last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentJoins = joins.filter(
        j => j.key !== 'initialized' && j.value.joinedAt > sevenDaysAgo
      ).length;
      const recentLeaves = leaves.filter(
        l => l.key !== 'initialized' && l.value.leftAt > sevenDaysAgo
      ).length;

      // Get largest guild
      const largestGuild = message.client.guilds.cache.reduce(
        (prev, current) =>
          prev.memberCount > current.memberCount ? prev : current
      );

      // Get oldest guild (by join time)
      const oldestJoin = joins
        .filter(j => j.key !== 'initialized')
        .sort((a, b) => a.value.joinedAt - b.value.joinedAt)[0];

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📊 Guild Statistics')
        .setDescription(
          `**Current Guilds:** ${totalGuilds}\n` +
            `**Total Members:** ${totalMembers.toLocaleString()}\n` +
            `**Average Members/Guild:** ${Math.floor(totalMembers / totalGuilds)}`
        )
        .addFields(
          {
            name: '📈 All-Time Stats',
            value:
              `**Total Joins:** ${totalJoins}\n` +
              `**Total Leaves:** ${totalLeaves}\n` +
              `**Retention Rate:** ${totalJoins > 0 ? ((1 - totalLeaves / totalJoins) * 100).toFixed(1) : 0}%`,
            inline: true,
          },
          {
            name: '📅 Last 7 Days',
            value:
              `**Joins:** ${recentJoins}\n` +
              `**Leaves:** ${recentLeaves}\n` +
              `**Net Change:** ${recentJoins - recentLeaves > 0 ? '+' : ''}${recentJoins - recentLeaves}`,
            inline: true,
          },
          {
            name: '🏆 Largest Guild',
            value: `**${largestGuild.name}**\n${largestGuild.memberCount.toLocaleString()} members`,
            inline: true,
          }
        )
        .setFooter({
          text: 'Use //guildstats recent to see recent activity',
        })
        .setTimestamp();

      if (oldestJoin) {
        embed.addFields({
          name: '⏰ Oldest Guild',
          value: `**${oldestJoin.value.name}**\nJoined <t:${Math.floor(oldestJoin.value.joinedAt / 1000)}:R>`,
          inline: true,
        });
      }

      return message.reply({ embeds: [embed] });
    }
  },
};
