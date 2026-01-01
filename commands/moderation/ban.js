const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'ban',
  description: 'Ban a member from the server.',
  usage: '<@member> [reason]',
  category: 'moderation',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ You do not have permission to ban members.');
    }

    // Get member
    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('❌ Please mention a member to ban.');
    }

    // Self-ban check
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot ban yourself.');
    }

    // Bot check
    if (member.user.bot && member.id === message.client.user.id) {
      return message.reply('❌ I cannot ban myself.');
    }

    // Owner check
    if (member.id === message.guild.ownerId) {
      return message.reply('❌ You cannot ban the server owner.');
    }

    // Role hierarchy check
    if (
      member.roles.highest.position >= message.member.roles.highest.position &&
      message.guild.ownerId !== message.author.id
    ) {
      return message.reply(
        '❌ You cannot ban this member due to role hierarchy.'
      );
    }

    // Bannable check
    if (!member.bannable) {
      return message.reply(
        '❌ I cannot ban this member. They may have a higher role than me.'
      );
    }

    // Get reason
    const reason = args.slice(1).join(' ') || 'No reason provided';

    // Try to DM the user before banning
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You have been banned from ${message.guild.name}`)
        .setColor(branding.colors.error)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: message.author.tag }
        )
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled
    }

    // Ban the member
    try {
      await member.ban({
        reason: `${reason} | Banned by ${message.author.tag}`,
        deleteMessageSeconds: 0,
      });

      const embed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('🔨 Member Banned')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: '👤 Member', value: `${member.user.tag}`, inline: true },
          { name: '🆔 User ID', value: member.id, inline: true },
          { name: '📝 Reason', value: reason, inline: false },
          {
            name: '👮 Moderator',
            value: `${message.author.tag}`,
            inline: true,
          },
          {
            name: '📅 Date',
            value: new Date().toLocaleString(),
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      const reply = await message.reply({ embeds: [embed] });

      // Auto-delete after 10 seconds
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 10000);
    } catch (error) {
      console.error('Error banning member:', error);
      return message.reply('❌ Failed to ban this member.');
    }
  },
};
