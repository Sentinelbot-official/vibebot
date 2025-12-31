const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'serveranalytics',
  aliases: ['analytics', 'serverstats', 'guildanalytics'],
  description: 'Advanced server analytics and insights',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return message.reply('❌ You need Manage Server permission!');
    }

    const guild = message.guild;

    // Member analytics
    const totalMembers = guild.memberCount;
    const humans = guild.members.cache.filter(m => !m.user.bot).size;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const online = guild.members.cache.filter(
      m => m.presence?.status === 'online'
    ).size;
    const onlinePercent = ((online / totalMembers) * 100).toFixed(1);

    // Role analytics
    const totalRoles = guild.roles.cache.size;
    const hoistedRoles = guild.roles.cache.filter(r => r.hoist).size;
    const managedRoles = guild.roles.cache.filter(r => r.managed).size;

    // Channel analytics
    const totalChannels = guild.channels.cache.size;
    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
    const categories = guild.channels.cache.filter(c => c.type === 4).size;
    const threads = guild.channels.cache.filter(c => c.isThread()).size;

    // Emoji analytics
    const totalEmojis = guild.emojis.cache.size;
    const staticEmojis = guild.emojis.cache.filter(e => !e.animated).size;
    const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;

    // Boost analytics
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boosters = guild.members.cache.filter(m => m.premiumSince).size;

    // Server age
    const createdDays = Math.floor(
      (Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24)
    );

    // Activity score (rough estimate)
    const activityScore = Math.min(
      100,
      Math.floor(
        onlinePercent * 0.4 +
          boostLevel * 10 +
          (totalChannels / 10) * 5 +
          (totalEmojis / 10) * 5
      )
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${guild.name} Analytics`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setDescription(
        `**Server Age:** ${createdDays} days | **Activity Score:** ${activityScore}/100`
      )
      .addFields(
        {
          name: '👥 Members',
          value: `**Total:** ${totalMembers}\n**Humans:** ${humans}\n**Bots:** ${bots}\n**Online:** ${online} (${onlinePercent}%)`,
          inline: true,
        },
        {
          name: '📺 Channels',
          value: `**Total:** ${totalChannels}\n**Text:** ${textChannels}\n**Voice:** ${voiceChannels}\n**Categories:** ${categories}\n**Threads:** ${threads}`,
          inline: true,
        },
        {
          name: '🎭 Roles',
          value: `**Total:** ${totalRoles}\n**Hoisted:** ${hoistedRoles}\n**Managed:** ${managedRoles}`,
          inline: true,
        },
        {
          name: '😀 Emojis',
          value: `**Total:** ${totalEmojis}\n**Static:** ${staticEmojis}\n**Animated:** ${animatedEmojis}`,
          inline: true,
        },
        {
          name: '💎 Boosts',
          value: `**Level:** ${boostLevel}\n**Boosts:** ${boostCount}\n**Boosters:** ${boosters}`,
          inline: true,
        },
        {
          name: '🔒 Security',
          value: `**Verification:** ${guild.verificationLevel}\n**2FA Required:** ${guild.mfaLevel === 1 ? 'Yes' : 'No'}\n**Explicit Filter:** ${guild.explicitContentFilter}`,
          inline: true,
        }
      )
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
