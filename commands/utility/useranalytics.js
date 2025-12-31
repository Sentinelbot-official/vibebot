const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'useranalytics',
  aliases: ['useranalysis', 'profile'],
  description: 'Advanced user analytics and profile',
  usage: '[@user]',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const target = message.mentions.members.first() || message.member;
    const user = target.user;

    // Get economy data
    const economy = db.get('economy', user.id) || {
      coins: 0,
      bank: 0,
      totalEarned: 0,
      totalSpent: 0,
    };

    // Get leveling data
    const leveling = db.get('leveling', user.id) || { xp: 0, level: 1 };

    // Get warns
    const warns = db.get('warns', user.id) || [];

    // Account age
    const accountAge = Math.floor(
      (Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24)
    );

    // Server join age
    const joinAge = Math.floor(
      (Date.now() - target.joinedTimestamp) / (1000 * 60 * 60 * 24)
    );

    // Role count
    const roleCount = target.roles.cache.size - 1; // Exclude @everyone

    // Permissions count
    const permCount = target.permissions.toArray().length;

    // Calculate activity score
    const activityScore = Math.min(
      100,
      Math.floor(
        leveling.level * 5 +
          (economy.totalEarned || 0) / 1000 +
          roleCount * 2 +
          (target.premiumSince ? 20 : 0) -
          warns.length * 10
      )
    );

    // User badges
    const badges = [];
    if (target.id === message.guild.ownerId) badges.push('👑 Server Owner');
    if (target.permissions.has('Administrator'))
      badges.push('🛡️ Administrator');
    if (target.premiumSince) badges.push('💎 Server Booster');
    if (user.bot) badges.push('🤖 Bot');
    if (leveling.level >= 50) badges.push('⭐ Level 50+');
    if (economy.coins + economy.bank >= 100000) badges.push('💰 Wealthy');
    if (warns.length === 0) badges.push('✅ Clean Record');

    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor || 0x0099ff)
      .setTitle(`📊 ${user.tag}'s Profile`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(badges.length > 0 ? badges.join(' ') : 'No badges yet')
      .addFields(
        {
          name: '📈 Activity',
          value: `**Score:** ${activityScore}/100\n**Level:** ${leveling.level}\n**XP:** ${leveling.xp.toLocaleString()}`,
          inline: true,
        },
        {
          name: '💰 Economy',
          value: `**Net Worth:** ${((economy.coins || 0) + (economy.bank || 0)).toLocaleString()}\n**Earned:** ${(economy.totalEarned || 0).toLocaleString()}\n**Spent:** ${(economy.totalSpent || 0).toLocaleString()}`,
          inline: true,
        },
        {
          name: '⚖️ Moderation',
          value: `**Warnings:** ${warns.length}\n**Status:** ${warns.length === 0 ? '✅ Good' : warns.length < 3 ? '⚠️ Caution' : '🚫 Multiple Infractions'}`,
          inline: true,
        },
        {
          name: '📅 Account Info',
          value: `**Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>\n**Age:** ${accountAge} days`,
          inline: true,
        },
        {
          name: '🏠 Server Info',
          value: `**Joined:** <t:${Math.floor(target.joinedTimestamp / 1000)}:R>\n**Member For:** ${joinAge} days`,
          inline: true,
        },
        {
          name: '🎭 Roles & Perms',
          value: `**Roles:** ${roleCount}\n**Permissions:** ${permCount}\n**Highest Role:** ${target.roles.highest}`,
          inline: true,
        }
      )
      .setFooter({ text: `User ID: ${user.id}` })
      .setTimestamp();

    if (user.bannerURL()) {
      embed.setImage(user.bannerURL({ dynamic: true, size: 1024 }));
    }

    message.reply({ embeds: [embed] });
  },
};
