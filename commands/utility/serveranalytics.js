const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'serveranalytics',
  description: 'View comprehensive server analytics and insights',
  aliases: ['analytics', 'serverstats', 'insights'],
  category: 'utility',
  cooldown: 30,
  async execute(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need the Manage Server permission to view analytics!'
      );
    }

    const guild = message.guild;

    // Member statistics
    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    // Online status
    const onlineMembers = guild.members.cache.filter(
      m => m.presence?.status === 'online'
    ).size;
    const idleMembers = guild.members.cache.filter(
      m => m.presence?.status === 'idle'
    ).size;
    const dndMembers = guild.members.cache.filter(
      m => m.presence?.status === 'dnd'
    ).size;

    // Role statistics
    const totalRoles = guild.roles.cache.size - 1; // Exclude @everyone
    const highestRole = guild.roles.highest;

    // Channel statistics
    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
    const categories = guild.channels.cache.filter(c => c.type === 4).size;
    const totalChannels = guild.channels.cache.size;

    // Boost statistics
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boosters = guild.members.cache.filter(m => m.premiumSince).size;

    // Server age
    const createdAt = guild.createdAt;
    const serverAge = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get bot-specific stats
    const settings = db.get('guild_settings', guild.id) || {};
    const autoRoles = settings.autoRoles?.length || 0;
    const autoResponders = settings.autoResponders?.length || 0;
    const wordFilters = settings.wordFilter?.length || 0;
    const regexFilters = settings.regexFilters?.length || 0;

    // Get economy stats
    const economyData = db.all('economy');
    let totalCoins = 0;
    let richestUser = null;
    let richestAmount = 0;

    if (economyData) {
      for (const [userId, data] of Object.entries(economyData)) {
        const member = guild.members.cache.get(userId);
        if (member) {
          const wealth = (data.coins || 0) + (data.bank || 0);
          totalCoins += wealth;
          if (wealth > richestAmount) {
            richestAmount = wealth;
            richestUser = member.user.username;
          }
        }
      }
    }

    // Get leveling stats
    const levelingData = db.all('leveling');
    let highestLevel = 0;
    let topUser = null;

    if (levelingData) {
      for (const [userId, data] of Object.entries(levelingData)) {
        const member = guild.members.cache.get(userId);
        if (member && data.level > highestLevel) {
          highestLevel = data.level;
          topUser = member.user.username;
        }
      }
    }

    const embed = new EmbedBuilder()
      .setColor(guild.members.me.displayHexColor || 0x0099ff)
      .setTitle(`📊 ${guild.name} Analytics`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '👥 Members',
          value: `Total: ${totalMembers}\nHumans: ${humanCount}\nBots: ${botCount}`,
          inline: true,
        },
        {
          name: '🟢 Online Status',
          value: `Online: ${onlineMembers}\nIdle: ${idleMembers}\nDND: ${dndMembers}`,
          inline: true,
        },
        {
          name: '📅 Server Age',
          value: `${serverAge} days\nCreated: ${createdAt.toLocaleDateString()}`,
          inline: true,
        },
        {
          name: '📁 Channels',
          value: `Total: ${totalChannels}\nText: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`,
          inline: true,
        },
        {
          name: '🎭 Roles',
          value: `Total: ${totalRoles}\nHighest: ${highestRole.name}`,
          inline: true,
        },
        {
          name: '💎 Boosts',
          value: `Level: ${boostLevel}\nBoosts: ${boostCount}\nBoosters: ${boosters}`,
          inline: true,
        }
      );

    // Add bot features stats
    if (
      autoRoles > 0 ||
      autoResponders > 0 ||
      wordFilters > 0 ||
      regexFilters > 0
    ) {
      embed.addFields({
        name: '🤖 Bot Features',
        value: `Auto-Roles: ${autoRoles}\nAuto-Responders: ${autoResponders}\nWord Filters: ${wordFilters}\nRegex Filters: ${regexFilters}`,
        inline: true,
      });
    }

    // Add economy stats
    if (totalCoins > 0) {
      embed.addFields({
        name: '💰 Economy',
        value: `Total Coins: ${totalCoins.toLocaleString()}\nRichest: ${richestUser || 'N/A'}\nWealth: ${richestAmount.toLocaleString()}`,
        inline: true,
      });
    }

    // Add leveling stats
    if (highestLevel > 0) {
      embed.addFields({
        name: '⭐ Leveling',
        value: `Highest Level: ${highestLevel}\nTop User: ${topUser || 'N/A'}`,
        inline: true,
      });
    }

    // Server features
    const features =
      guild.features.length > 0
        ? guild.features.slice(0, 5).join(', ')
        : 'None';
    embed.addFields({
      name: '✨ Server Features',
      value: features,
      inline: false,
    });

    embed.setFooter(branding.footers.default).setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
