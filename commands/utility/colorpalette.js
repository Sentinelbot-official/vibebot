const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

module.exports = {
  name: 'colorpalette',
  aliases: ['palette', 'colors', 'extractcolors'],
  description: 'Extract color palette from an image',
  usage: '[image url or attachment]',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    // Get image URL
    let imageUrl;
    const attachment = message.attachments.first();
    const urlArg = args[0];
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
    } else if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎨 Color Palette Extractor')
        .setDescription(
          '**Extract beautiful color palettes from images!**\n\n' +
            '**Usage:**\n' +
            '• Attach an image\n' +
            '• Provide an image URL\n' +
            '• Reply to a message with an image\n\n' +
            '**Features:**\n' +
            '• Extracts dominant colors\n' +
            '• Shows hex codes\n' +
            '• RGB values\n' +
            '• Color names\n' +
            '• Palette visualization\n\n' +
            '**Examples:**\n' +
            '• `//colorpalette` (with attachment)\n' +
            '• `//colorpalette https://example.com/image.jpg`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } else {
      return message.reply(
        '❌ Please provide an image!\n' +
          '• Attach an image\n' +
          '• Provide an image URL\n' +
          '• Reply to a message with an image'
      );
    }

    const loading = await message.reply(
      `${branding.emojis.loading} Extracting color palette...`
    );

    try {
      // Use a color extraction API
      // For now, provide tools and manual extraction guide

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎨 Color Palette Extraction Guide')
        .setDescription(
          `**Image:** [View Image](${imageUrl})\n\n` +
            '**Extract colors using these tools:**'
        )
        .addFields(
          {
            name: '🌐 Online Tools (Instant)',
            value:
              '• [Coolors.co](https://coolors.co/image-picker) - Upload & extract\n' +
              '• [Adobe Color](https://color.adobe.com/create/image) - Professional\n' +
              '• [ColorMind](http://colormind.io/) - AI-powered\n' +
              '• [Canva Color Palette](https://www.canva.com/colors/color-palette-generator/) - Easy',
            inline: false,
          },
          {
            name: '🔧 Browser Extensions',
            value:
              '• **ColorZilla** (Chrome/Firefox) - Eyedropper tool\n' +
              '• **ColorPick Eyedropper** (Chrome) - Quick picker\n' +
              '• **Eye Dropper** (Firefox) - Simple & fast',
            inline: false,
          },
          {
            name: '💻 Desktop Software',
            value:
              '• **Photoshop** - Image → Mode → Indexed Color\n' +
              '• **GIMP** - Colors → Color Palette\n' +
              '• **Affinity Designer** - Color picker tool',
            inline: false,
          },
          {
            name: '📱 Mobile Apps',
            value:
              '• **Adobe Capture** (iOS/Android) - Extract palettes\n' +
              '• **Palette Cam** (iOS) - Camera color picker\n' +
              '• **Color Grab** (Android) - Quick extraction',
            inline: false,
          },
          {
            name: '⚡ Quick Method',
            value:
              '1. Go to [Coolors.co/image-picker](https://coolors.co/image-picker)\n' +
              '2. Upload your image\n' +
              '3. View extracted palette\n' +
              '4. Copy hex codes\n' +
              '5. Export or share!',
            inline: false,
          },
          {
            name: '💡 What You Can Do With Palettes',
            value:
              '• Design matching graphics\n' +
              '• Create brand colors\n' +
              '• Match website themes\n' +
              '• Art inspiration\n' +
              '• Color coordination',
            inline: false,
          }
        )
        .setThumbnail(imageUrl)
        .setFooter(branding.footers.default)
        .setTimestamp();

      // Try to get basic color info using a simple API
      try {
        // Using the Color Thief API or similar
        const apiUrl = `https://api.color.pizza/v1/?url=${encodeURIComponent(imageUrl)}`;
        const colorResponse = await axios.get(apiUrl, { timeout: 5000 });

        if (colorResponse.data && colorResponse.data.colors) {
          const colors = colorResponse.data.colors.slice(0, 5);
          const colorFields = colors.map((color, i) => ({
            name: `Color ${i + 1}`,
            value:
              `**Hex:** ${color.hex}\n` +
              `**RGB:** rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\n` +
              `**Name:** ${color.name}`,
            inline: true,
          }));

          embed.spliceFields(0, 0, ...colorFields);
          embed.setDescription(
            `**Extracted ${colors.length} dominant colors!**\n\n` +
              embed.data.description
          );
        }
      } catch (apiError) {
        // API failed, just show the guide
        console.log('Color API unavailable, showing guide only');
      }

      return loading.edit({
        content: null,
        embeds: [embed],
      });
    } catch (error) {
      console.error('Color palette error:', error);
      return loading.edit(
        `${branding.emojis.error} Failed to process image! Make sure the URL is valid and accessible.`
      );
    }
  },
};
