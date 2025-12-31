const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'embed',
  description: 'Create a custom embed message',
  usage:
    '<channel> <title> | <description> | [color] | [image_url] | [thumbnail_url]',
  aliases: ['createembed', 'embedcreate'],
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return message.reply('❌ You need Manage Messages permission!');
    }

    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `embed <#channel> <title> | <description> | [color] | [image_url] | [thumbnail_url]`\n' +
          'Example: `embed #general Hello | This is a test embed | #ff0000 | https://example.com/image.png`'
      );
    }

    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (!channel || !channel.isTextBased()) {
      return message.reply('❌ Please provide a valid text channel!');
    }

    // Remove channel mention from args
    args.shift();

    // Parse embed data
    const embedData = args
      .join(' ')
      .split('|')
      .map(s => s.trim());

    if (embedData.length < 2) {
      return message.reply(
        '❌ Please provide at least a title and description separated by `|`'
      );
    }

    const [title, description, color, imageUrl, thumbnailUrl] = embedData;

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(title.substring(0, 256))
      .setDescription(description.substring(0, 4096))
      .setColor(color ? parseInt(color.replace('#', ''), 16) : 0x5865f2)
      .setFooter({ text: `Created by ${message.author.tag}` })
      .setTimestamp();

    if (imageUrl) {
      try {
        new URL(imageUrl);
        embed.setImage(imageUrl);
      } catch {
        // Invalid URL, skip
      }
    }

    if (thumbnailUrl) {
      try {
        new URL(thumbnailUrl);
        embed.setThumbnail(thumbnailUrl);
      } catch {
        // Invalid URL, skip
      }
    }

    try {
      await channel.send({ embeds: [embed] });
      message.reply(`✅ Embed sent to ${channel}!`);
    } catch (error) {
      console.error('Error sending embed:', error);
      message.reply('❌ Failed to send embed. Check my permissions!');
    }
  },
};
