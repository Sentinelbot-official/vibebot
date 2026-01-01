const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

const filters = {
  grayscale: { name: 'Grayscale', emoji: '⚫' },
  sepia: { name: 'Sepia', emoji: '🟤' },
  invert: { name: 'Invert', emoji: '🔄' },
  blur: { name: 'Blur', emoji: '💫' },
  sharpen: { name: 'Sharpen', emoji: '🔪' },
  pixelate: { name: 'Pixelate', emoji: '🎮' },
  brightness: { name: 'Brighten', emoji: '☀️' },
  darkness: { name: 'Darken', emoji: '🌙' },
  vintage: { name: 'Vintage', emoji: '📷' },
  neon: { name: 'Neon', emoji: '💡' },
  oil: { name: 'Oil Paint', emoji: '🎨' },
  sketch: { name: 'Sketch', emoji: '✏️' },
};

module.exports = {
  name: 'imagefilter',
  aliases: ['filter', 'imgfilter', 'fx'],
  description: 'Apply advanced filters to images',
  usage: '<filter> [image url or attachment]',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const filterName = args[0]?.toLowerCase();

    if (!filterName || !filters[filterName]) {
      const filterList = Object.entries(filters)
        .map(([key, val]) => `${val.emoji} \`${key}\` - ${val.name}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎨 Image Filters')
        .setDescription(
          '**Apply professional filters to your images!**\n\n' +
            '**Available Filters:**\n' +
            filterList +
            '\n\n**Usage:**\n' +
            '`//imagefilter <filter> [image]`\n\n' +
            '**Examples:**\n' +
            '• `//imagefilter grayscale` (with attachment)\n' +
            '• `//imagefilter sepia https://example.com/image.jpg`\n' +
            '• Reply to a message with an image'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Get image URL
    let imageUrl;
    const attachment = message.attachments.first();
    const urlArg = args[1];
    const referencedMsg = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId)
      : null;

    if (attachment && attachment.contentType?.startsWith('image/')) {
      imageUrl = attachment.url;
    } else if (
      urlArg &&
      urlArg.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i)
    ) {
      imageUrl = urlArg;
    } else if (
      referencedMsg?.attachments.first()?.contentType?.startsWith('image/')
    ) {
      imageUrl = referencedMsg.attachments.first().url;
    } else {
      return message.reply(
        '❌ Please provide an image!\n' +
          '• Attach an image\n' +
          '• Provide an image URL\n' +
          '• Reply to a message with an image'
      );
    }

    const loading = await message.reply(
      `${branding.emojis.loading} Applying **${filters[filterName].name}** filter...`
    );

    try {
      // Using a free image processing API (imgbb or similar)
      // For now, we'll provide instructions and use some-random-api.ml for basic filters

      const apiUrl = `https://some-random-api.ml/canvas/${filterName}?avatar=${encodeURIComponent(imageUrl)}`;

      // Try to fetch the filtered image
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const attachment = new AttachmentBuilder(Buffer.from(response.data), {
        name: `filtered_${filterName}.png`,
      });

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle(
          `${filters[filterName].emoji} ${filters[filterName].name} Filter Applied!`
        )
        .setImage(`attachment://filtered_${filterName}.png`)
        .setFooter(branding.footers.default)
        .setTimestamp();

      return loading.edit({
        content: null,
        embeds: [embed],
        files: [attachment],
      });
    } catch (error) {
      console.error('Image filter error:', error.message);

      // Fallback: Provide alternative methods
      const embed = new EmbedBuilder()
        .setColor(branding.colors.warning)
        .setTitle('🎨 Image Filter Guide')
        .setDescription(
          `**Filter:** ${filters[filterName].name}\n` +
            `**Original Image:** [View](${imageUrl})\n\n` +
            '**Apply this filter using:**'
        )
        .addFields(
          {
            name: '🌐 Online Tools',
            value:
              '• [Photopea](https://www.photopea.com/) - Free Photoshop alternative\n' +
              '• [Pixlr](https://pixlr.com/editor/) - Quick online editor\n' +
              '• [Fotor](https://www.fotor.com/) - Easy filters',
            inline: false,
          },
          {
            name: '📱 Mobile Apps',
            value:
              '• **Snapseed** (iOS/Android) - Professional editing\n' +
              '• **VSCO** (iOS/Android) - Preset filters\n' +
              '• **Lightroom Mobile** (iOS/Android) - Advanced',
            inline: false,
          },
          {
            name: '💻 Desktop Software',
            value:
              '• **GIMP** - Free & open source\n' +
              '• **Photoshop** - Industry standard\n' +
              '• **Affinity Photo** - One-time purchase',
            inline: false,
          }
        )
        .setThumbnail(imageUrl)
        .setFooter(branding.footers.default)
        .setTimestamp();

      return loading.edit({
        content:
          '⚠️ **Automatic filtering temporarily unavailable.**\nHere are alternative methods:',
        embeds: [embed],
      });
    }
  },
};
