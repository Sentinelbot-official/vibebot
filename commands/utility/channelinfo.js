const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'channelinfo',
  aliases: ['cinfo', 'channel'],
  description: 'Get detailed information about a channel',
  usage: '[#channel]',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    const typeNames = {
      [ChannelType.GuildText]: '💬 Text Channel',
      [ChannelType.GuildVoice]: '🔊 Voice Channel',
      [ChannelType.GuildCategory]: '📁 Category',
      [ChannelType.GuildAnnouncement]: '📢 Announcement Channel',
      [ChannelType.GuildStageVoice]: '🎙️ Stage Channel',
      [ChannelType.GuildForum]: '💭 Forum Channel',
      [ChannelType.GuildNews]: '📰 News Channel',
      [ChannelType.PublicThread]: '🧵 Public Thread',
      [ChannelType.PrivateThread]: '🔒 Private Thread',
    };

    const typeEmojis = {
      [ChannelType.GuildText]: '💬',
      [ChannelType.GuildVoice]: '🔊',
      [ChannelType.GuildCategory]: '📁',
      [ChannelType.GuildAnnouncement]: '📢',
      [ChannelType.GuildStageVoice]: '🎙️',
      [ChannelType.GuildForum]: '💭',
    };

    // Calculate channel age
    const ageInDays = Math.floor(
      (Date.now() - channel.createdTimestamp) / (1000 * 60 * 60 * 24)
    );
    const ageInYears = (ageInDays / 365).toFixed(1);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle(`${typeEmojis[channel.type] || '📺'} ${channel.name}`)
      .setDescription(
        channel.topic
          ? `*${channel.topic.substring(0, 200)}${channel.topic.length > 200 ? '...' : ''}*\n\u200b`
          : null
      )
      .addFields(
        {
          name: '🆔 Channel ID',
          value: `\`${channel.id}\``,
          inline: true,
        },
        {
          name: '📋 Type',
          value: typeNames[channel.type] || 'Unknown',
          inline: true,
        },
        {
          name: '📅 Created',
          value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>\n(${ageInYears} years old)`,
          inline: true,
        },
        {
          name: '📊 Position',
          value: `#${channel.position + 1}`,
          inline: true,
        }
      );

    // Category info
    if (channel.parent) {
      embed.addFields({
        name: '📁 Category',
        value: `${channel.parent.name}\n\`${channel.parent.id}\``,
        inline: true,
      });
    } else {
      embed.addFields({
        name: '📁 Category',
        value: 'None',
        inline: true,
      });
    }

    // Text channel specific info
    if (
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.GuildAnnouncement
    ) {
      const webhooks = await channel.fetchWebhooks().catch(() => null);
      const threads = channel.threads?.cache.size || 0;
      const activeThreads =
        channel.threads?.cache.filter(t => !t.archived).size || 0;

      embed.addFields(
        {
          name: '🔞 NSFW',
          value: channel.nsfw ? '✅ Yes' : '❌ No',
          inline: true,
        },
        {
          name: '⏱️ Slowmode',
          value: channel.rateLimitPerUser
            ? `${channel.rateLimitPerUser}s delay`
            : '❌ Disabled',
          inline: true,
        },
        {
          name: '🪝 Webhooks',
          value: webhooks ? `${webhooks.size}` : 'Unknown',
          inline: true,
        },
        {
          name: '🧵 Threads',
          value: `${activeThreads} active / ${threads} total`,
          inline: true,
        }
      );

      // Get message count (approximate from database if available)
      const channelStats = db.get('channel_stats', channel.id);
      if (channelStats) {
        embed.addFields({
          name: '💬 Messages',
          value: `~${channelStats.messageCount?.toLocaleString() || 'Unknown'} messages`,
          inline: true,
        });
      }
    }

    // Voice channel specific info
    if (
      channel.type === ChannelType.GuildVoice ||
      channel.type === ChannelType.GuildStageVoice
    ) {
      const bitrateKbps = channel.bitrate / 1000;
      const maxBitrate =
        message.guild.premiumTier === 3
          ? 384
          : message.guild.premiumTier === 2
            ? 256
            : message.guild.premiumTier === 1
              ? 128
              : 96;

      embed.addFields(
        {
          name: '🎵 Bitrate',
          value: `${bitrateKbps}kbps / ${maxBitrate}kbps\n${bitrateKbps >= 128 ? '🎧 High Quality' : '📻 Standard'}`,
          inline: true,
        },
        {
          name: '👥 User Limit',
          value: channel.userLimit
            ? `${channel.userLimit} users`
            : '♾️ Unlimited',
          inline: true,
        },
        {
          name: '🔊 Current Members',
          value: `${channel.members.size} connected`,
          inline: true,
        }
      );

      if (channel.members.size > 0) {
        const memberList = channel.members
          .map(m => m.user.username)
          .slice(0, 10)
          .join(', ');

        embed.addFields({
          name: '👤 Connected Users',
          value:
            memberList +
            (channel.members.size > 10
              ? ` and ${channel.members.size - 10} more...`
              : ''),
          inline: false,
        });
      }

      // Voice region
      if (channel.rtcRegion) {
        embed.addFields({
          name: '🌍 Region',
          value:
            channel.rtcRegion === 'automatic'
              ? '🌐 Automatic'
              : channel.rtcRegion,
          inline: true,
        });
      }

      // Video quality
      if (channel.videoQualityMode) {
        const quality = channel.videoQualityMode === 1 ? '📹 Auto' : '🎬 720p';
        embed.addFields({
          name: '📹 Video Quality',
          value: quality,
          inline: true,
        });
      }
    }

    // Forum channel specific info
    if (channel.type === ChannelType.GuildForum) {
      const activeThreads =
        channel.threads?.cache.filter(t => !t.archived).size || 0;
      const totalThreads = channel.threads?.cache.size || 0;

      embed.addFields(
        {
          name: '💭 Forum Posts',
          value: `${activeThreads} active / ${totalThreads} total`,
          inline: true,
        },
        {
          name: '⏱️ Default Slowmode',
          value: channel.defaultThreadRateLimitPerUser
            ? `${channel.defaultThreadRateLimitPerUser}s`
            : 'None',
          inline: true,
        }
      );

      if (channel.availableTags && channel.availableTags.length > 0) {
        const tags = channel.availableTags
          .slice(0, 5)
          .map(t => t.name)
          .join(', ');
        embed.addFields({
          name: '🏷️ Available Tags',
          value:
            tags +
            (channel.availableTags.length > 5
              ? `... (+${channel.availableTags.length - 5} more)`
              : ''),
          inline: false,
        });
      }
    }

    // Permission overwrites
    const overwrites = channel.permissionOverwrites.cache;
    if (overwrites.size > 0) {
      const overwriteList = overwrites
        .map(overwrite => {
          const target =
            overwrite.type === 0
              ? message.guild.roles.cache.get(overwrite.id)
              : message.guild.members.cache.get(overwrite.id);
          const name = target
            ? overwrite.type === 0
              ? `@${target.name}`
              : target.user.username
            : 'Unknown';
          return name;
        })
        .slice(0, 5)
        .join(', ');

      embed.addFields({
        name: '🔐 Permission Overwrites',
        value: `${overwrites.size} override${overwrites.size !== 1 ? 's' : ''}: ${overwriteList}${overwrites.size > 5 ? '...' : ''}`,
        inline: false,
      });
    }

    // Mention
    embed.addFields({
      name: '🔗 Mention',
      value: `${channel}`,
      inline: true,
    });

    embed.setFooter(branding.footers.default);
    embed.setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
