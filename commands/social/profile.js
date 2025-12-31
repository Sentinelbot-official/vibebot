const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'profile',
  description: "View your or another user's profile",
  usage: '[@user]',
  aliases: ['p', 'userprofile'],
  category: 'social',
  cooldown: 5,
  async execute(message, args) {
    const targetUser = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(targetUser.id);

    // Get user data from various systems
    const economy = db.get('economy', targetUser.id) || { coins: 0, bank: 0 };
    const leveling = db.get('leveling', targetUser.id) || { level: 1, xp: 0 };
    const reputation = db.get('reputation', targetUser.id) || { total: 0 };
    const marriage = db.get('marriages', targetUser.id);
    const profileData = db.get('profiles', targetUser.id) || {
      bio: 'No bio set',
      badges: [],
    };

    // Calculate total wealth
    const totalWealth = economy.coins + economy.bank;

    // Get marriage info
    let marriageText = 'Single';
    if (marriage) {
      const partner = await message.client.users
        .fetch(marriage.partnerId)
        .catch(() => null);
      marriageText = partner ? `Married to ${partner.tag}` : 'Married';
    }

    // Get account age
    const accountCreated = targetUser.createdAt;
    const accountAge = Math.floor(
      (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get server join date
    const joinedAt = member ? member.joinedAt : null;
    const joinAge = joinedAt
      ? Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || 0x0099ff)
      .setTitle(`📋 ${targetUser.username}'s Profile`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(profileData.bio || 'No bio set')
      .addFields(
        { name: '🆔 User ID', value: targetUser.id, inline: true },
        {
          name: '📅 Account Created',
          value: `${accountAge} days ago`,
          inline: true,
        },
        {
          name: '📥 Joined Server',
          value: joinAge ? `${joinAge} days ago` : 'Unknown',
          inline: true,
        },
        {
          name: '💰 Wealth',
          value: `${totalWealth.toLocaleString()} coins`,
          inline: true,
        },
        { name: '⭐ Level', value: leveling.level.toString(), inline: true },
        {
          name: '🏆 Reputation',
          value: reputation.total.toString(),
          inline: true,
        },
        { name: '💕 Relationship', value: marriageText, inline: false }
      );

    // Add badges if any
    if (profileData.badges && profileData.badges.length > 0) {
      embed.addFields({
        name: '🏅 Badges',
        value: profileData.badges.join(' '),
        inline: false,
      });
    }

    // Add roles if in server
    if (member && member.roles.cache.size > 1) {
      const roles = member.roles.cache
        .filter(role => role.id !== message.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 10);

      if (roles.length > 0) {
        embed.addFields({
          name: '🎭 Roles',
          value: roles.join(', '),
          inline: false,
        });
      }
    }

    embed.setFooter(branding.footers.default).setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
