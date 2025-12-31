const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');

module.exports = {
  name: 'customembed',
  description: 'Create custom embeds (Premium only)',
  usage: '//customembed <title> | <description> | [color] | [image_url]',
  aliases: ['embed', 'createembed'],
  category: 'premium',
  cooldown: 10,
  async execute(message, args) {
    const guildId = message.guild.id;

    // Check premium
    if (!premiumPerks.hasFeature(guildId, 'custom_embeds')) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Premium Required')
        .setDescription(
          'This feature requires **Premium** or **VIP**!\n\n' +
            '**Premium Benefits:**\n' +
            '• Create custom embeds\n' +
            '• Custom bot status\n' +
            '• Economy bonuses\n' +
            '• Early access features\n' +
            '• And more!\n\n' +
            'Use `//premium` to learn more!'
        )
        .setFooter({ text: 'Support the 24/7 live coding journey! 💜' });

      return message.reply({ embeds: [embed] });
    }

    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply(
        '❌ You need the **Manage Messages** permission to create custom embeds!'
      );
    }

    // Check embed limit
    const embedCount =
      db.get('embed_count', `${guildId}_${message.author.id}`) || 0;
    const limit = premiumPerks.getLimit(guildId, 'maxCustomEmbeds');

    if (embedCount >= limit) {
      return message.reply(
        `❌ You've reached your custom embed limit! (${embedCount}/${limit})\n` +
          'Delete some embeds or upgrade to VIP for more!'
      );
    }

    if (!args.length) {
      const exampleEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📝 Custom Embed Creator')
        .setDescription(
          '**Create beautiful custom embeds!**\n\n' +
            '**Usage:**\n' +
            '`//customembed <title> | <description> | [color] | [image_url]`\n\n' +
            '**Example:**\n' +
            '`//customembed Welcome! | Thanks for joining our server! | #00ff00 | https://i.imgur.com/example.png`\n\n' +
            '**Parameters:**\n' +
            '• **Title** - Embed title (required)\n' +
            '• **Description** - Embed description (required)\n' +
            '• **Color** - Hex color code (optional, default: #0099ff)\n' +
            '• **Image URL** - Image URL (optional)\n\n' +
            '**Tips:**\n' +
            '• Separate parameters with `|`\n' +
            '• Use hex colors like `#ff0000` for red\n' +
            '• Image URLs must start with `http://` or `https://`'
        )
        .addFields({
          name: '📊 Your Stats',
          value: `**Embeds Created:** ${embedCount}/${limit}\n**Tier:** ${premiumPerks.getTierBadge(guildId)} ${premiumPerks.getTierDisplayName(guildId)}`,
          inline: false,
        })
        .setFooter({ text: 'Premium Feature 💎' });

      return message.reply({ embeds: [exampleEmbed] });
    }

    // Parse arguments
    const parts = args
      .join(' ')
      .split('|')
      .map(p => p.trim());

    if (parts.length < 2) {
      return message.reply(
        '❌ Invalid format! Use: `//customembed <title> | <description> | [color] | [image_url]`'
      );
    }

    const title = parts[0];
    const description = parts[1];
    const color = parts[2] || '#0099ff';
    const imageUrl = parts[3] || null;

    // Validate
    if (title.length > 256) {
      return message.reply('❌ Title must be 256 characters or less!');
    }

    if (description.length > 4096) {
      return message.reply('❌ Description must be 4096 characters or less!');
    }

    // Validate color
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(color)) {
      return message.reply(
        '❌ Invalid color! Use hex format like `#ff0000` for red.'
      );
    }

    // Validate image URL
    if (imageUrl && !imageUrl.startsWith('http')) {
      return message.reply(
        '❌ Invalid image URL! Must start with `http://` or `https://`'
      );
    }

    try {
      // Create embed
      const customEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({
          text: `Created by ${message.author.tag} | Premium Feature 💎`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      if (imageUrl) {
        customEmbed.setImage(imageUrl);
      }

      // Send embed
      await message.channel.send({ embeds: [customEmbed] });

      // Delete command message
      if (message.deletable) {
        await message.delete().catch(() => {});
      }

      // Increment counter
      db.set('embed_count', `${guildId}_${message.author.id}`, embedCount + 1);

      // Send confirmation in DM
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Custom Embed Created!')
        .setDescription(
          `Your custom embed has been posted in <#${message.channel.id}>!\n\n` +
            `**Embeds Created:** ${embedCount + 1}/${limit}`
        )
        .setFooter({ text: 'Premium Feature 💎' });

      await message.author.send({ embeds: [confirmEmbed] }).catch(() => {
        // If DM fails, send in channel
        message.channel
          .send({ embeds: [confirmEmbed] })
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      });
    } catch (error) {
      const logger = require('../../utils/logger');
      logger.error('Custom embed creation error:', error);

      return message.reply(
        '❌ Failed to create embed! Please check your parameters and try again.'
      );
    }
  },
};
