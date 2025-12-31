const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'userinfo',
  description: 'Get information about a user (mention or provide user ID)',
  usage: '[@user | userID]',
  category: 'general',
  async execute(message, args) {
    let user;
    let member;

    try {
      // Check for mention first
      if (message.mentions.users.first()) {
        user = message.mentions.users.first();
      }
      // Check for user ID in args
      else if (args[0]) {
        user = await message.client.users.fetch(args[0]).catch(() => null);
      }
      // Default to message author
      else {
        user = message.author;
      }

      if (!user) {
        return message.reply('❌ Could not find that user!');
      }

      // Try to get member info if they're in the server
      member = message.guild.members.cache.get(user.id);

      const avatar = user.displayAvatarURL({ dynamic: true, size: 256 });
      const createdAt = user.createdAt.toLocaleString();
      const banner = user.bannerURL({ size: 512 });

      const embed = new EmbedBuilder()
        .setColor(member?.displayHexColor || 0x0099ff)
        .setTitle(`${user.username}'s Info`)
        .setThumbnail(avatar)
        .addFields(
          { name: '👤 Username', value: user.tag, inline: true },
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '📅 Account Created', value: createdAt, inline: false }
        );

      // Add server-specific info if member exists
      if (member) {
        const joinedAt = member.joinedAt.toLocaleString();
        const roles =
          member.roles.cache.size > 1
            ? member.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.name)
                .join(', ')
            : 'None';

        embed.addFields(
          { name: '📥 Joined Server', value: joinedAt, inline: true },
          {
            name: '🎭 Nickname',
            value: member.nickname || 'None',
            inline: true,
          },
          { name: '🎨 Roles', value: roles, inline: false }
        );

        // Add status if presence is available
        if (member.presence) {
          const status = member.presence.status || 'offline';
          embed.addFields({
            name: '📡 Status',
            value: status,
            inline: true,
          });

          // Add activities if any
          if (member.presence.activities.length > 0) {
            const activities = member.presence.activities
              .map(activity => activity.name)
              .join(', ');
            embed.addFields({
              name: '🎮 Activities',
              value: activities,
              inline: true,
            });
          }
        }
      } else {
        embed.addFields({
          name: '⚠️ Server Status',
          value: 'Not in this server',
          inline: false,
        });
      }

      // Add banner if exists
      if (banner) {
        embed.setImage(banner);
      }

      embed.setFooter({ text: `Requested by ${message.author.tag}` });
      embed.setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in userinfo command:', error);
      message.reply('❌ An error occurred while fetching user information!');
    }
  },
};
