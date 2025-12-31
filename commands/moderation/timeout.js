const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'timeout',
  description: 'Timeout a member from the server.',
  usage: '<@member> <duration_in_minutes> [reason]',
  category: 'moderation',
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply('❌ You do not have permission to timeout members.');
    }

    // Get member
    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('❌ Please mention a member to timeout.');
    }

    // Get duration (in minutes)
    const duration = parseInt(args[1]);
    if (isNaN(duration) || duration < 1) {
      return message.reply(
        '❌ Please enter a valid duration in minutes (minimum 1 minute).'
      );
    }

    // Max timeout is 28 days (40320 minutes)
    if (duration > 40320) {
      return message.reply(
        '❌ Maximum timeout duration is 28 days (40320 minutes).'
      );
    }

    // Self-timeout check
    if (member.id === message.author.id) {
      return message.reply('❌ You cannot timeout yourself.');
    }

    // Bot check
    if (member.user.bot && member.id === message.client.user.id) {
      return message.reply('❌ I cannot timeout myself.');
    }

    // Owner check
    if (member.id === message.guild.ownerId) {
      return message.reply('❌ You cannot timeout the server owner.');
    }

    // Role hierarchy check
    if (
      member.roles.highest.position >= message.member.roles.highest.position &&
      message.guild.ownerId !== message.author.id
    ) {
      return message.reply(
        '❌ You cannot timeout this member due to role hierarchy.'
      );
    }

    // Moderatable check
    if (!member.moderatable) {
      return message.reply(
        '❌ I cannot timeout this member. They may have a higher role than me.'
      );
    }

    // Get reason
    const reason = args.slice(2).join(' ') || 'No reason provided';

    // Convert minutes to milliseconds
    const durationMs = duration * 60 * 1000;

    // Format duration for display
    const formatDuration = mins => {
      if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''}`;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (remainingMins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMins} minute${remainingMins !== 1 ? 's' : ''}`;
    };

    // Try to DM the user before timing out
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You have been timed out in ${message.guild.name}`)
        .setColor(0xff9900)
        .addFields(
          { name: 'Duration', value: formatDuration(duration) },
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: message.author.tag }
        )
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled
    }

    // Timeout the member
    try {
      await member.timeout(durationMs, `${reason} | By ${message.author.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0xff9900)
        .setTitle('⏱️ Member Timed Out')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: '👤 Member', value: `${member.user.tag}`, inline: true },
          { name: '🆔 User ID', value: member.id, inline: true },
          {
            name: '⏰ Duration',
            value: formatDuration(duration),
            inline: true,
          },
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
        .setFooter({ text: `Timed out by ${message.author.tag}` })
        .setTimestamp();

      const reply = await message.reply({ embeds: [embed] });

      // Auto-delete after 10 seconds
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 10000);
    } catch (error) {
      console.error('Error timing out member:', error);
      return message.reply('❌ Failed to timeout this member.');
    }
  },
};
