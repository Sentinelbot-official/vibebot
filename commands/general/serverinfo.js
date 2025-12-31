const { EmbedBuilder, ChannelType } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const branding = require('../../utils/branding');

module.exports = {
  name: 'serverinfo',
  description: 'Get advanced information about this server',
  usage: '',
  aliases: ['server', 'guild', 'guildinfo'],
  category: 'general',
  cooldown: 5,
  async execute(message, args) {
    const guild = message.guild;
    if (!guild) {
      return message.reply('❌ This command can only be used in a server.');
    }

    // Fetch owner
    let ownerMention;
    try {
      const owner = await guild.fetchOwner();
      ownerMention = owner.user ? `<@${owner.user.id}>` : 'Unknown';
    } catch (err) {
      ownerMention = 'Unknown';
    }

    // Get premium status
    const tierBadge = premiumPerks.getTierBadge(guild.id);
    const tierName = premiumPerks.getTierDisplayName(guild.id);

    // Icon and banner
    const iconURL = guild.iconURL({ dynamic: true, size: 512 });
    const bannerURL = guild.bannerURL({ size: 1024 });

    // Timestamps
    const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
    const createdAgo = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;

    // Member statistics
    const memberCount = guild.memberCount;
    const members = await guild.members.fetch();
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;
    const onlineMembers = members.filter(
      m => m.presence?.status !== 'offline'
    ).size;

    // Channel statistics
    const textChannels = guild.channels.cache.filter(
      ch => ch.type === ChannelType.GuildText
    ).size;
    const voiceChannels = guild.channels.cache.filter(
      ch => ch.type === ChannelType.GuildVoice
    ).size;
    const categories = guild.channels.cache.filter(
      ch => ch.type === ChannelType.GuildCategory
    ).size;
    const stageChannels = guild.channels.cache.filter(
      ch => ch.type === ChannelType.GuildStageVoice
    ).size;
    const forumChannels = guild.channels.cache.filter(
      ch => ch.type === ChannelType.GuildForum
    ).size;
    const threads = guild.channels.cache.filter(ch => ch.isThread()).size;

    // Role statistics
    const roleCount = guild.roles.cache.size;
    const highestRole = guild.roles.highest;

    // Emoji and sticker statistics
    const emojiCount = guild.emojis.cache.size;
    const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
    const stickerCount = guild.stickers.cache.size;

    // Boost information
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostTier = guild.premiumTier;
    const boostProgress = getBoostProgress(boostCount, boostTier);
    const boosters = members.filter(m => m.premiumSince).size;

    // Server features
    const features =
      guild.features.length > 0
        ? guild.features
            .map(f => formatFeature(f))
            .slice(0, 10)
            .join(', ')
        : 'None';

    // Verification level
    const verificationLevels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Very High',
    };
    const verificationLevel =
      verificationLevels[guild.verificationLevel] || 'Unknown';

    // Content filter
    const contentFilters = {
      0: 'Disabled',
      1: 'Members without roles',
      2: 'All members',
    };
    const contentFilter =
      contentFilters[guild.explicitContentFilter] || 'Unknown';

    // Server age
    const ageInDays = Math.floor(
      (Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24)
    );
    const ageInYears = (ageInDays / 365).toFixed(1);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle(`${tierBadge} ${guild.name}`)
      .setDescription(
        guild.description ||
          `**Server ID:** ${guild.id}\n**Premium Tier:** ${tierBadge} ${tierName}`
      )
      .setThumbnail(iconURL)
      .addFields(
        {
          name: '👑 Ownership',
          value:
            `**Owner:** ${ownerMention}\n` +
            `**Created:** ${createdAt}\n` +
            `**Age:** ${ageInDays.toLocaleString()} days (${ageInYears} years)\n` +
            `**Created:** ${createdAgo}`,
          inline: false,
        },
        {
          name: '👥 Members',
          value:
            `**Total:** ${memberCount.toLocaleString()}\n` +
            `**Humans:** ${humans.toLocaleString()}\n` +
            `**Bots:** ${bots.toLocaleString()}\n` +
            `**Online:** ${onlineMembers.toLocaleString()}`,
          inline: true,
        },
        {
          name: '📺 Channels',
          value:
            `**Text:** ${textChannels}\n` +
            `**Voice:** ${voiceChannels}\n` +
            `**Categories:** ${categories}\n` +
            `**Stage:** ${stageChannels}\n` +
            `**Forum:** ${forumChannels}\n` +
            `**Threads:** ${threads}`,
          inline: true,
        },
        {
          name: '🎨 Customization',
          value:
            `**Roles:** ${roleCount}\n` +
            `**Emojis:** ${emojiCount} (${animatedEmojis} animated)\n` +
            `**Stickers:** ${stickerCount}\n` +
            `**Highest Role:** ${highestRole}`,
          inline: true,
        },
        {
          name: '🚀 Server Boost',
          value:
            `**Tier:** ${boostTier === 0 ? 'None' : `Level ${boostTier}`}\n` +
            `**Boosts:** ${boostCount}\n` +
            `**Boosters:** ${boosters}\n` +
            `**Progress:** ${boostProgress}`,
          inline: true,
        },
        {
          name: '🛡️ Security',
          value:
            `**Verification:** ${verificationLevel}\n` +
            `**Content Filter:** ${contentFilter}\n` +
            `**2FA Required:** ${guild.mfaLevel === 1 ? 'Yes' : 'No'}\n` +
            `**NSFW Level:** ${guild.nsfwLevel}`,
          inline: true,
        },
        {
          name: '💎 Premium Status',
          value:
            `**Tier:** ${tierBadge} ${tierName}\n` +
            `**Perks:** ${tierName === 'Free' ? 'Basic features' : tierName === 'Premium' ? '2x rewards, custom status' : 'All features, stocks, businesses'}\n` +
            `**Upgrade:** Use \`//premium\``,
          inline: true,
        }
      );

    // Add features if any
    if (guild.features.length > 0) {
      embed.addFields({
        name: '✨ Server Features',
        value: features,
        inline: false,
      });
    }

    // Add banner if exists
    if (bannerURL) {
      embed.setImage(bannerURL);
    }

    embed.setFooter(branding.footers.default);
    embed.setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

function getBoostProgress(boostCount, currentTier) {
  const tierRequirements = {
    0: { next: 1, required: 2 },
    1: { next: 2, required: 7 },
    2: { next: 3, required: 14 },
    3: { next: null, required: null },
  };

  const tierInfo = tierRequirements[currentTier];
  if (!tierInfo.next) return 'Max Tier Reached! 🎉';

  const remaining = tierInfo.required - boostCount;
  const progress = Math.min(
    (boostCount / tierInfo.required) * 100,
    100
  ).toFixed(0);

  return remaining > 0
    ? `${remaining} more for Tier ${tierInfo.next} (${progress}%)`
    : `Ready for Tier ${tierInfo.next}!`;
}

function formatFeature(feature) {
  const featureNames = {
    ANIMATED_ICON: '📹 Animated Icon',
    BANNER: '🎨 Banner',
    COMMERCE: '🛒 Commerce',
    COMMUNITY: '🌐 Community',
    DISCOVERABLE: '🔍 Discoverable',
    FEATURABLE: '⭐ Featurable',
    INVITE_SPLASH: '🎭 Invite Splash',
    MEMBER_VERIFICATION_GATE_ENABLED: '✅ Membership Screening',
    NEWS: '📰 News Channels',
    PARTNERED: '🤝 Partnered',
    PREVIEW_ENABLED: '👀 Preview',
    VANITY_URL: '🔗 Vanity URL',
    VERIFIED: '✅ Verified',
    VIP_REGIONS: '🌍 VIP Regions',
    WELCOME_SCREEN_ENABLED: '👋 Welcome Screen',
    TICKETED_EVENTS_ENABLED: '🎫 Events',
    MONETIZATION_ENABLED: '💰 Monetization',
    MORE_STICKERS: '🎨 More Stickers',
    THREE_DAY_THREAD_ARCHIVE: '📝 3-Day Threads',
    SEVEN_DAY_THREAD_ARCHIVE: '📝 7-Day Threads',
    PRIVATE_THREADS: '🔒 Private Threads',
  };

  return featureNames[feature] || feature;
}
