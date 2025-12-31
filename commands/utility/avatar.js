const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp', 'profilepic'],
  description: "Get a user's avatar with download links and server avatar",
  usage: '[@user]',
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);

    // Check if user has a GIF avatar
    const hasGif = user.avatar && user.avatar.startsWith('a_');

    // Get global avatar
    const globalAvatar = user.displayAvatarURL({ dynamic: true, size: 4096 });

    // Get server-specific avatar if exists
    const serverAvatar = member?.avatar
      ? member.displayAvatarURL({ dynamic: true, size: 4096 })
      : null;

    // Determine which avatar to show
    const showingServer = args.includes('server') || args.includes('guild');
    const displayAvatar =
      showingServer && serverAvatar ? serverAvatar : globalAvatar;
    const avatarType =
      showingServer && serverAvatar ? 'Server Avatar' : 'Global Avatar';

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || 0x0099ff)
      .setTitle(`${user.username}'s ${avatarType}`)
      .setImage(displayAvatar)
      .setDescription(
        `**Format:** ${hasGif ? 'GIF (Animated)' : 'Static'}\n` +
          `**Resolution:** 4096x4096\n\u200b`
      )
      .addFields({
        name: '🔗 Download Links',
        value:
          `[PNG](${user.displayAvatarURL({ extension: 'png', size: 4096 })}) • ` +
          `[JPG](${user.displayAvatarURL({ extension: 'jpg', size: 4096 })}) • ` +
          `[WEBP](${user.displayAvatarURL({ extension: 'webp', size: 4096 })})` +
          (hasGif
            ? ` • [GIF](${user.displayAvatarURL({ extension: 'gif', size: 4096 })})`
            : ''),
        inline: false,
      });

    // Add server avatar info if different
    if (serverAvatar && serverAvatar !== globalAvatar) {
      embed.addFields({
        name: '🏠 Server Avatar',
        value: `This user has a different avatar in this server!\nUse \`//avatar ${user.username} server\` to view it.`,
        inline: false,
      });
    }

    embed.setFooter({
      text: `Requested by ${message.author.tag} | User ID: ${user.id}`,
      iconURL: message.author.displayAvatarURL(),
    });
    embed.setTimestamp();

    // Create buttons for quick actions
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open in Browser')
        .setStyle(ButtonStyle.Link)
        .setURL(displayAvatar)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setLabel('Download PNG')
        .setStyle(ButtonStyle.Link)
        .setURL(user.displayAvatarURL({ extension: 'png', size: 4096 }))
        .setEmoji('📥')
    );

    // Add GIF button if applicable
    if (hasGif) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('Download GIF')
          .setStyle(ButtonStyle.Link)
          .setURL(user.displayAvatarURL({ extension: 'gif', size: 4096 }))
          .setEmoji('🎬')
      );
    }

    // Add server avatar button if different
    if (serverAvatar && serverAvatar !== globalAvatar && !showingServer) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('Server Avatar')
          .setStyle(ButtonStyle.Link)
          .setURL(serverAvatar)
          .setEmoji('🏠')
      );
    }

    message.reply({ embeds: [embed], components: [row] });
  },
};
