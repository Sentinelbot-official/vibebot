const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

module.exports = {
  name: 'gifcreate',
  aliases: ['makegif', 'videotogif'],
  description: 'Create a GIF from a video URL or attachment',
  usage: '<video url or attachment> [start time] [duration]',
  category: 'utility',
  cooldown: 30,
  async execute(message, args) {
    const apiKey = process.env.GIPHY_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ GIF creation not configured!\n\n' +
          '**Setup:**\n' +
          '1. Get API key from [Giphy Developers](https://developers.giphy.com/)\n' +
          '2. Add `GIPHY_API_KEY=your_key` to .env\n\n' +
          "**Alternative:** Attach a video and I'll provide conversion instructions!"
      );
    }

    // Check for video attachment
    const attachment = message.attachments.first();
    const videoUrl = args[0] || attachment?.url;

    if (!videoUrl) {
      return message.reply(
        '❌ Please provide a video URL or attach a video!\n' +
          'Usage: `//gifcreate <url> [start_time] [duration]`\n' +
          'Example: `//gifcreate https://example.com/video.mp4 5 3`\n\n' +
          'Supported formats: MP4, MOV, WEBM\n' +
          'Start time: seconds from start (default: 0)\n' +
          'Duration: seconds of GIF (default: 3, max: 10)'
      );
    }

    // Parse parameters
    const startTime = parseInt(args[1]) || 0;
    const duration = Math.min(parseInt(args[2]) || 3, 10); // Max 10 seconds

    if (startTime < 0 || duration < 1) {
      return message.reply(
        '❌ Invalid parameters!\n' +
          'Start time must be 0 or positive\n' +
          'Duration must be between 1-10 seconds'
      );
    }

    const loading = await message.reply(
      `${branding.emojis.loading} Creating GIF... This may take a moment!`
    );

    try {
      // For now, provide instructions since video-to-GIF conversion
      // requires ffmpeg or external services
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎬 GIF Creation Guide')
        .setDescription(
          `**Video URL:** ${videoUrl}\n` +
            `**Start Time:** ${startTime}s\n` +
            `**Duration:** ${duration}s\n\n` +
            '**How to create your GIF:**'
        )
        .addFields(
          {
            name: '🌐 Online Tools',
            value:
              '• [Ezgif](https://ezgif.com/video-to-gif) - Free, no signup\n' +
              '• [Giphy](https://giphy.com/create/gifmaker) - Create & share\n' +
              '• [Imgur](https://imgur.com/vidgif) - Quick conversion',
            inline: false,
          },
          {
            name: '💻 Desktop Tools',
            value:
              '• **Photoshop** - File → Import → Video Frames to Layers\n' +
              '• **GIMP** - Filters → Animation → Optimize for GIF\n' +
              '• **FFmpeg** - Command line tool (see below)',
            inline: false,
          },
          {
            name: '⚡ FFmpeg Command',
            value:
              '```bash\n' +
              `ffmpeg -i input.mp4 -ss ${startTime} -t ${duration} ` +
              '-vf "fps=15,scale=480:-1:flags=lanczos" output.gif\n' +
              '```',
            inline: false,
          },
          {
            name: '📱 Mobile Apps',
            value:
              '• **GIF Maker** (iOS/Android)\n' +
              '• **ImgPlay** (iOS/Android)\n' +
              '• **Video to GIF** (Android)',
            inline: false,
          },
          {
            name: '💡 Tips',
            value:
              '• Keep GIFs under 10MB for Discord\n' +
              '• Lower FPS (10-15) for smaller file size\n' +
              '• Reduce resolution if needed (480p works well)\n' +
              '• Shorter duration = smaller file size',
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return loading.edit({
        content:
          '📹 **Video-to-GIF conversion requires external tools.**\n' +
          'Here are the best methods to create your GIF:',
        embeds: [embed],
      });
    } catch (error) {
      console.error('GIF creation error:', error);
      return loading.edit(
        `${branding.emojis.error} Failed to process video! Make sure the URL is valid and accessible.`
      );
    }
  },
};
