const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const branding = require('../../utils/branding');

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
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
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

    const [title, description, colorStr, imageUrl, thumbnailUrl] = embedData;

    // Validate title and description
    if (!title || title.trim().length === 0) {
      return message.reply('❌ Title cannot be empty!');
    }

    if (!description || description.trim().length === 0) {
      return message.reply('❌ Description cannot be empty!');
    }

    // Parse color safely
    let color = 0x5865f2;
    if (colorStr) {
      const cleanColor = colorStr.replace('#', '').trim();
      const parsedColor = parseInt(cleanColor, 16);
      if (!isNaN(parsedColor) && parsedColor >= 0 && parsedColor <= 0xffffff) {
        color = parsedColor;
      }
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(title.substring(0, 256))
      .setDescription(description.substring(0, 4096))
      .setColor(color)
      .setFooter(branding.footers.default)
      .setTimestamp();

    // Validate and set image URL
    if (imageUrl && imageUrl.trim().length > 0) {
      try {
        const url = new URL(imageUrl.trim());
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          embed.setImage(imageUrl.trim());
        }
      } catch {
        // Invalid URL, skip silently
      }
    }

    // Validate and set thumbnail URL
    if (thumbnailUrl && thumbnailUrl.trim().length > 0) {
      try {
        const url = new URL(thumbnailUrl.trim());
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          embed.setThumbnail(thumbnailUrl.trim());
        }
      } catch {
        // Invalid URL, skip silently
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
