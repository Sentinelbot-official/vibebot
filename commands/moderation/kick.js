const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'kick',
  description: 'Kick a member from the server.',
  usage: '<@member> [reason]',
  category: 'moderation',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ You do not have permission to kick members.');
    }

    // Get member
    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('❌ Please mention a member to kick.');
    }

    // Self-kick check
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot kick yourself.');
    }

    // Bot check
    if (member.user.bot && member.id === message.client.user.id) {
      return message.reply('❌ I cannot kick myself.');
    }

    // Owner check
    if (member.id === message.guild.ownerId) {
      return message.reply('❌ You cannot kick the server owner.');
    }

    // Role hierarchy check
    if (
      member.roles.highest.position >= message.member.roles.highest.position &&
      message.guild.ownerId !== message.author.id
    ) {
      return message.reply(
        '❌ You cannot kick this member due to role hierarchy.'
      );
    }

    // Kickable check
    if (!member.kickable) {
      return message.reply(
        '❌ I cannot kick this member. They may have a higher role than me.'
      );
    }

    // Get reason
    const reason = args.slice(1).join(' ') || 'No reason provided';

    // Try to DM the user before kicking
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You have been kicked from ${message.guild.name}`)
        .setColor(0xff9900)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: message.author.tag }
        )
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled
    }

    // Kick the member
    try {
      await member.kick(`${reason} | Kicked by ${message.author.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0xff9900)
        .setTitle('👢 Member Kicked')
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
        .setFooter({ text: `Kicked by ${message.author.tag}` })
        .setTimestamp();

      const reply = await message.reply({ embeds: [embed] });

      // Auto-delete after 10 seconds
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 10000);
    } catch (error) {
      console.error('Error kicking member:', error);
      return message.reply('❌ Failed to kick this member.');
    }
  },
};
