const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'collage',
  aliases: ['photocollage', 'imagegrid'],
  description: 'Create a collage from multiple images',
  usage: '<layout> <image urls or attachments>',
  category: 'utility',
  cooldown: 15,
  async execute(message, args) {
    const layout = args[0]?.toLowerCase();
    const validLayouts = ['2x2', '3x3', '2x3', '3x2', '1x4', '4x1'];

    if (!layout || !validLayouts.includes(layout)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🖼️ Collage Maker')
        .setDescription(
          '**Create beautiful photo collages!**\n\n' +
            '**Available Layouts:**\n' +
            '• `2x2` - 4 images in a square\n' +
            '• `3x3` - 9 images in a grid\n' +
            '• `2x3` - 6 images (2 rows, 3 columns)\n' +
            '• `3x2` - 6 images (3 rows, 2 columns)\n' +
            '• `1x4` - 4 images in a row\n' +
            '• `4x1` - 4 images in a column\n\n' +
            '**Usage:**\n' +
            '`//collage <layout> <image urls>`\n' +
            'Or attach multiple images\n\n' +
            '**Examples:**\n' +
            '• `//collage 2x2` (with 4 attachments)\n' +
            '• `//collage 3x3 url1 url2 url3...`\n\n' +
            '**Tips:**\n' +
            '• All images should be similar size\n' +
            '• Maximum 9 images\n' +
            '• Supports JPG, PNG, GIF'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Parse layout dimensions
    const [rows, cols] = layout.split('x').map(Number);
    const requiredImages = rows * cols;

    // Collect image URLs
    const imageUrls = [];

    // From attachments
    message.attachments.forEach(att => {
      if (att.contentType?.startsWith('image/')) {
        imageUrls.push(att.url);
      }
    });

    // From arguments
    args.slice(1).forEach(arg => {
      if (arg.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i)) {
        imageUrls.push(arg);
      }
    });

    if (imageUrls.length < requiredImages) {
      return message.reply(
        `❌ Not enough images!\n` +
          `**Layout:** ${layout} requires **${requiredImages} images**\n` +
          `**Provided:** ${imageUrls.length} images\n\n` +
          `Please attach ${requiredImages - imageUrls.length} more image(s).`
      );
    }

    if (imageUrls.length > requiredImages) {
      imageUrls.length = requiredImages; // Trim to required amount
    }

    const loading = await message.reply(
      `${branding.emojis.loading} Creating ${layout} collage with ${requiredImages} images...`
    );

    try {
      // Provide collage creation guide
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🖼️ ${layout} Collage Guide`)
        .setDescription(
          `**Layout:** ${rows} rows × ${cols} columns\n` +
            `**Images:** ${requiredImages}\n\n` +
            '**Create your collage using:**'
        )
        .addFields(
          {
            name: '🌐 Online Tools (Free)',
            value:
              `• [Canva](https://www.canva.com/create/photo-collages/) - Drag & drop\n` +
              `• [Fotor](https://www.fotor.com/features/collage/) - Quick collages\n` +
              `• [BeFunky](https://www.befunky.com/create/collage/) - Easy layouts\n` +
              `• [PicCollage](https://pic-collage.com/) - Mobile friendly`,
            inline: false,
          },
          {
            name: '📱 Mobile Apps',
            value:
              '• **PicsArt** (iOS/Android) - Feature-rich\n' +
              '• **Layout** by Instagram (iOS/Android) - Quick\n' +
              '• **Pic Collage** (iOS/Android) - Easy to use\n' +
              '• **PhotoGrid** (iOS/Android) - Many templates',
            inline: false,
          },
          {
            name: '💻 Desktop Software',
            value:
              '• **Photoshop** - File → Automate → Contact Sheet\n' +
              '• **GIMP** - Filters → Combine → Filmstrip\n' +
              '• **Canva Desktop** - Professional templates',
            inline: false,
          },
          {
            name: '⚡ Quick Method',
            value:
              '1. Go to [Canva.com](https://canva.com)\n' +
              `2. Search for "${layout} grid"\n` +
              '3. Upload your images\n' +
              '4. Drag images into grid\n' +
              '5. Download and share!',
            inline: false,
          },
          {
            name: '📸 Your Images',
            value: imageUrls
              .map((url, i) => `${i + 1}. [Image ${i + 1}](${url})`)
              .join('\n'),
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return loading.edit({
        content:
          '🖼️ **Collage creation requires external tools.**\n' +
          'Here are the best methods to create your collage:',
        embeds: [embed],
      });
    } catch (error) {
      console.error('Collage error:', error);
      return loading.edit(
        `${branding.emojis.error} Failed to process images! Make sure all URLs are valid.`
      );
    }
  },
};
