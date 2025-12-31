const { AttachmentBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'imagemanip',
  description: 'Image manipulation commands',
  usage: '<filter> [@user]',
  aliases: ['img', 'filter'],
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Available filters: blur, grayscale, invert, sepia, pixelate, brighten, darken\nUsage: `imagemanip <filter> [@user]`'
      );
    }

    const filter = args[0].toLowerCase();
    const validFilters = [
      'blur',
      'grayscale',
      'invert',
      'sepia',
      'pixelate',
      'brighten',
      'darken',
    ];

    if (!validFilters.includes(filter)) {
      return message.reply(
        `❌ Invalid filter! Available: ${validFilters.join(', ')}`
      );
    }

    // Get target user
    const target = message.mentions.users.first() || message.author;
    const avatarURL = target.displayAvatarURL({
      extension: 'png',
      size: 512,
      forceStatic: true,
    });

    const processingMsg = await message.reply('🎨 Processing image...');

    try {
      // Check if canvas is available
      let Canvas;
      try {
        Canvas = require('@napi-rs/canvas');
      } catch (err) {
        // Canvas not installed, use API fallback
        return processingMsg.edit(
          `❌ Image manipulation requires the \`@napi-rs/canvas\` package.\n\nInstall it with: \`npm install @napi-rs/canvas\`\n\nOr use an online API service for image manipulation.`
        );
      }

      // Download avatar
      const response = await axios.get(avatarURL, {
        responseType: 'arraybuffer',
      });
      const imageBuffer = Buffer.from(response.data);

      // Load image
      const image = await Canvas.loadImage(imageBuffer);
      const canvas = Canvas.createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      // Draw original image
      ctx.drawImage(image, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply filters
      switch (filter) {
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // Red
            data[i + 1] = avg; // Green
            data[i + 2] = avg; // Blue
          }
          break;

        case 'invert':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i]; // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
          }
          break;

        case 'sepia':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
          }
          break;

        case 'brighten':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + 50);
            data[i + 1] = Math.min(255, data[i + 1] + 50);
            data[i + 2] = Math.min(255, data[i + 2] + 50);
          }
          break;

        case 'darken':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, data[i] - 50);
            data[i + 1] = Math.max(0, data[i + 1] - 50);
            data[i + 2] = Math.max(0, data[i + 2] - 50);
          }
          break;

        case 'blur':
          // Simple box blur
          const radius = 3;
          const tempData = new Uint8ClampedArray(data);
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              let r = 0,
                g = 0,
                b = 0,
                count = 0;
              for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (
                    nx >= 0 &&
                    nx < canvas.width &&
                    ny >= 0 &&
                    ny < canvas.height
                  ) {
                    const idx = (ny * canvas.width + nx) * 4;
                    r += tempData[idx];
                    g += tempData[idx + 1];
                    b += tempData[idx + 2];
                    count++;
                  }
                }
              }
              const idx = (y * canvas.width + x) * 4;
              data[idx] = r / count;
              data[idx + 1] = g / count;
              data[idx + 2] = b / count;
            }
          }
          break;

        case 'pixelate':
          const pixelSize = 10;
          for (let y = 0; y < canvas.height; y += pixelSize) {
            for (let x = 0; x < canvas.width; x += pixelSize) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              for (let dy = 0; dy < pixelSize; dy++) {
                for (let dx = 0; dx < pixelSize; dx++) {
                  if (x + dx < canvas.width && y + dy < canvas.height) {
                    const pidx = ((y + dy) * canvas.width + (x + dx)) * 4;
                    data[pidx] = r;
                    data[pidx + 1] = g;
                    data[pidx + 2] = b;
                  }
                }
              }
            }
          }
          break;
      }

      // Put modified image data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to buffer
      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, {
        name: `${filter}-${target.username}.png`,
      });

      return processingMsg.edit({
        content: `🎨 Applied **${filter}** filter to ${target.username}'s avatar!`,
        files: [attachment],
      });
    } catch (error) {
      console.error('Image manipulation error:', error);
      return processingMsg.edit(
        `❌ Failed to process image: ${error.message}`
      );
    }
  },
};
