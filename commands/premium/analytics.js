const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');

module.exports = {
  name: 'analytics',
  description: 'View detailed server analytics (VIP only)',
  usage: '//analytics [members/activity/commands/growth]',
  aliases: ['stats', 'serverstats', 'insights'],
  category: 'premium',
  cooldown: 10,
  async execute(message, args) {
    const guildId = message.guild.id;

    // Check VIP
    if (!premiumPerks.hasFeature(guildId, 'custom_commands')) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ VIP Required')
        .setDescription(
          'Server analytics is a **VIP-exclusive** feature!\n\n' +
            '**VIP Benefits:**\n' +
            '• Detailed server analytics\n' +
            '• Member growth tracking\n' +
            '• Command usage statistics\n' +
            '• Activity insights\n' +
            '• All Premium features\n\n' +
            'Use `//premium` to upgrade!'
        )
        .setFooter({ text: 'Support the 24/7 live coding journey! 💜' });

      return message.reply({ embeds: [embed] });
    }

    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need the **Manage Server** permission to view analytics!'
      );
    }

    const category = args[0]?.toLowerCase() || 'overview';

    if (category === 'overview') {
      const guild = message.guild;

      // Calculate statistics
      const totalMembers = guild.memberCount;
      const onlineMembers = guild.members.cache.filter(
        m => m.presence?.status !== 'offline'
      ).size;
      const botCount = guild.members.cache.filter(m => m.bot).size;
      const humanCount = totalMembers - botCount;

      // Get channel counts
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const categories = guild.channels.cache.filter(c => c.type === 4).size;

      // Get role count
      const roleCount = guild.roles.cache.size;

      // Get server age
      const createdDays = Math.floor(
        (Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24)
      );

      // Get boost info
      const boostLevel = guild.premiumTier;
      const boostCount = guild.premiumSubscriptionCount || 0;

      // Get command usage stats
      const commandStats = db.get('command_stats', guildId) || {};
      const totalCommands = Object.values(commandStats).reduce(
        (a, b) => a + b,
        0
      );

      // Get activity stats
      const activityStats = db.get('activity_stats', guildId) || {
        messages: 0,
        reactions: 0,
        voiceMinutes: 0,
      };

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📊 ${guild.name} - Server Analytics`)
        .setThumbnail(guild.iconURL())
        .setDescription('**Comprehensive Server Insights**')
        .addFields(
          {
            name: '👥 Members',
            value:
              `**Total:** ${totalMembers.toLocaleString()}\n` +
              `**Humans:** ${humanCount.toLocaleString()}\n` +
              `**Bots:** ${botCount.toLocaleString()}\n` +
              `**Online:** ${onlineMembers.toLocaleString()}`,
            inline: true,
          },
          {
            name: '📺 Channels',
            value:
              `**Text:** ${textChannels}\n` +
              `**Voice:** ${voiceChannels}\n` +
              `**Categories:** ${categories}\n` +
              `**Total:** ${guild.channels.cache.size}`,
            inline: true,
          },
          {
            name: '🎨 Server Info',
            value:
              `**Roles:** ${roleCount}\n` +
              `**Emojis:** ${guild.emojis.cache.size}\n` +
              `**Boost Level:** ${boostLevel}\n` +
              `**Boosts:** ${boostCount}`,
            inline: true,
          },
          {
            name: '📈 Activity (Last 30 Days)',
            value:
              `**Messages:** ${activityStats.messages.toLocaleString()}\n` +
              `**Reactions:** ${activityStats.reactions.toLocaleString()}\n` +
              `**Voice Time:** ${Math.floor(activityStats.voiceMinutes / 60).toLocaleString()}h`,
            inline: true,
          },
          {
            name: '⚡ Commands',
            value:
              `**Total Used:** ${totalCommands.toLocaleString()}\n` +
              `**Avg/Day:** ${Math.floor(totalCommands / Math.max(createdDays, 1)).toLocaleString()}\n` +
              `**Most Used:** ${getMostUsedCommand(commandStats)}`,
            inline: true,
          },
          {
            name: '📅 Server Age',
            value:
              `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>\n` +
              `**Age:** ${createdDays.toLocaleString()} days\n` +
              `**Owner:** <@${guild.ownerId}>`,
            inline: true,
          }
        )
        .setFooter({
          text: '👑 VIP Feature | Use //analytics <members/activity/commands/growth> for details',
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (category === 'members') {
      const guild = message.guild;

      // Get member join data
      const joinData = db.get('member_joins', guildId) || {};
      const last30Days = Object.entries(joinData)
        .filter(
          ([date]) =>
            Date.now() - new Date(date).getTime() < 30 * 24 * 60 * 60 * 1000
        )
        .reduce((sum, [, count]) => sum + count, 0);

      const last7Days = Object.entries(joinData)
        .filter(
          ([date]) =>
            Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000
        )
        .reduce((sum, [, count]) => sum + count, 0);

      // Get member leave data
      const leaveData = db.get('member_leaves', guildId) || {};
      const left30Days = Object.entries(leaveData)
        .filter(
          ([date]) =>
            Date.now() - new Date(date).getTime() < 30 * 24 * 60 * 60 * 1000
        )
        .reduce((sum, [, count]) => sum + count, 0);

      const netGrowth30Days = last30Days - left30Days;
      const retentionRate =
        last30Days > 0 ? ((last30Days - left30Days) / last30Days) * 100 : 0;

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('👥 Member Analytics')
        .setDescription('**Member Growth & Retention**')
        .addFields(
          {
            name: '📊 Current Stats',
            value:
              `**Total Members:** ${guild.memberCount.toLocaleString()}\n` +
              `**Humans:** ${guild.members.cache.filter(m => !m.bot).size.toLocaleString()}\n` +
              `**Bots:** ${guild.members.cache.filter(m => m.bot).size.toLocaleString()}`,
            inline: true,
          },
          {
            name: '📈 Last 7 Days',
            value:
              `**Joined:** ${last7Days}\n` +
              `**Growth Rate:** ${(last7Days / 7).toFixed(1)}/day`,
            inline: true,
          },
          {
            name: '📅 Last 30 Days',
            value:
              `**Joined:** ${last30Days}\n` +
              `**Left:** ${left30Days}\n` +
              `**Net Growth:** ${netGrowth30Days >= 0 ? '+' : ''}${netGrowth30Days}\n` +
              `**Retention:** ${retentionRate.toFixed(1)}%`,
            inline: true,
          }
        )
        .setFooter({ text: '👑 VIP Feature | Member insights' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (category === 'activity') {
      const activityStats = db.get('activity_stats', guildId) || {
        messages: 0,
        reactions: 0,
        voiceMinutes: 0,
        lastUpdated: Date.now(),
      };

      const daysSinceUpdate = Math.max(
        1,
        Math.floor(
          (Date.now() - activityStats.lastUpdated) / (1000 * 60 * 60 * 24)
        )
      );

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📈 Activity Analytics')
        .setDescription('**Server Activity Insights (Last 30 Days)**')
        .addFields(
          {
            name: '💬 Messages',
            value:
              `**Total:** ${activityStats.messages.toLocaleString()}\n` +
              `**Per Day:** ${Math.floor(activityStats.messages / daysSinceUpdate).toLocaleString()}\n` +
              `**Per Hour:** ${Math.floor(activityStats.messages / (daysSinceUpdate * 24)).toLocaleString()}`,
            inline: true,
          },
          {
            name: '⭐ Reactions',
            value:
              `**Total:** ${activityStats.reactions.toLocaleString()}\n` +
              `**Per Day:** ${Math.floor(activityStats.reactions / daysSinceUpdate).toLocaleString()}`,
            inline: true,
          },
          {
            name: '🎙️ Voice Activity',
            value:
              `**Total:** ${Math.floor(activityStats.voiceMinutes / 60).toLocaleString()} hours\n` +
              `**Per Day:** ${Math.floor(activityStats.voiceMinutes / (daysSinceUpdate * 60)).toLocaleString()} hours`,
            inline: true,
          }
        )
        .setFooter({ text: '👑 VIP Feature | Activity tracking' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (category === 'commands') {
      const commandStats = db.get('command_stats', guildId) || {};

      if (Object.keys(commandStats).length === 0) {
        return message.reply('📭 No command usage data yet!');
      }

      const totalCommands = Object.values(commandStats).reduce(
        (a, b) => a + b,
        0
      );
      const sortedCommands = Object.entries(commandStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('⚡ Command Analytics')
        .setDescription(
          `**Total Commands Used:** ${totalCommands.toLocaleString()}\n\n` +
            '**Top 10 Commands:**\n' +
            sortedCommands
              .map(
                ([cmd, count], i) =>
                  `${i + 1}. \`${cmd}\` - ${count.toLocaleString()} uses (${((count / totalCommands) * 100).toFixed(1)}%)`
              )
              .join('\n')
        )
        .setFooter({ text: '👑 VIP Feature | Command usage tracking' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (category === 'growth') {
      const joinData = db.get('member_joins', guildId) || {};

      if (Object.keys(joinData).length === 0) {
        return message.reply('📭 No growth data yet!');
      }

      const last30Days = Object.entries(joinData)
        .filter(
          ([date]) =>
            Date.now() - new Date(date).getTime() < 30 * 24 * 60 * 60 * 1000
        )
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .slice(0, 7);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 Growth Analytics')
        .setDescription(
          '**Member Growth (Last 7 Days)**\n\n' +
            last30Days
              .map(
                ([date, count]) =>
                  `**${new Date(date).toLocaleDateString()}:** +${count} members`
              )
              .join('\n')
        )
        .setFooter({ text: '👑 VIP Feature | Growth tracking' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply(
      '❌ Invalid category! Use: `overview`, `members`, `activity`, `commands`, or `growth`'
    );
  },
};

function getMostUsedCommand(commandStats) {
  if (Object.keys(commandStats).length === 0) return 'None';

  const [cmd, count] = Object.entries(commandStats).sort(
    ([, a], [, b]) => b - a
  )[0];
  return `${cmd} (${count})`;
}
