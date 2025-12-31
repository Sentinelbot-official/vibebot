const { EmbedBuilder } = require('discord.js');
const earlyAccess = require('../../utils/earlyAccess');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images (Early Access - Premium only)',
  usage: '//imagine <prompt>',
  aliases: ['aiimage', 'generate'],
  category: 'utility',
  cooldown: 30,
  async execute(message, args) {
    // Check early access
    const access = earlyAccess.hasEarlyAccess(message.guild.id, 'ai_image_gen');

    if (!access.hasAccess) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🧪 Early Access Feature')
        .setDescription(
          `**${access.feature.name}** is currently in early access!\n\n` +
            `${access.reason}\n\n` +
            '**This feature will be available to everyone on:**\n' +
            `📅 ${new Date(access.feature.releaseDate).toLocaleDateString()}\n\n` +
            '**Want early access?**\n' +
            `Upgrade to **${access.feature.minTier === 'vip' ? 'VIP' : 'Premium'}** to use this feature now!\n\n` +
            'Use `//premium` to learn more or `//earlyaccess` to see all beta features.'
        )
        .setFooter({
          text: 'Support the 24/7 journey and get early access! 💜',
        });

      return message.reply({ embeds: [embed] });
    }

    // Feature is accessible!
    if (!args.length) {
      return message.reply(
        '❌ Please provide a prompt!\nUsage: `//imagine <description>`\n\nExample: `//imagine a purple robot with headphones`'
      );
    }

    const prompt = args.join(' ');

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY;

    if (!apiKey) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ AI Image Generation Not Configured')
        .setDescription(
          'This feature requires an API key to be configured.\n\n' +
            '**Setup:**\n' +
            'Add `OPENAI_API_KEY` or `STABILITY_API_KEY` to your .env file'
        );

      return message.reply({ embeds: [embed] });
    }

    // Send loading message
    const loadingEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎨 Generating Image...')
      .setDescription(
        `**Prompt:** ${prompt}\n\n` +
          '⏳ This may take 10-30 seconds...\n\n' +
          '💎 **Early Access Feature** - Thank you for supporting Vibe Bot!'
      );

    const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      // Implement AI image generation with OpenAI DALL-E or Stability AI
      let imageUrl = null;
      let model = 'unknown';

      if (process.env.OPENAI_API_KEY) {
        // Use OpenAI DALL-E
        const axios = require('axios');
        const response = await axios.post(
          'https://api.openai.com/v1/images/generations',
          {
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }
        );

        imageUrl = response.data.data[0].url;
        model = 'DALL-E 3';
      } else if (process.env.STABILITY_API_KEY) {
        // Use Stability AI
        const axios = require('axios');
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('output_format', 'png');

        const response = await axios.post(
          'https://api.stability.ai/v2beta/stable-image/generate/core',
          formData,
          {
            headers: {
              Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
              Accept: 'image/*',
            },
            responseType: 'arraybuffer',
            timeout: 60000,
          }
        );

        // Convert buffer to base64 for Discord
        const buffer = Buffer.from(response.data);
        imageUrl = buffer;
        model = 'Stable Diffusion';
      }

      if (imageUrl) {
        const resultEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎨 Image Generated!')
          .setDescription(`**Prompt:** ${prompt}\n**Model:** ${model}`)
          .setImage(typeof imageUrl === 'string' ? imageUrl : 'attachment://generated.png')
          .setFooter({
            text: 'Early Access Feature 🧪 | Built live on stream',
          })
          .setTimestamp();

        const messageOptions = { embeds: [resultEmbed] };
        
        // If using Stability AI (buffer), attach as file
        if (Buffer.isBuffer(imageUrl)) {
          messageOptions.files = [
            {
              attachment: imageUrl,
              name: 'generated.png',
            },
          ];
        }

        await loadingMsg.edit(messageOptions);
      } else {
        throw new Error('No API key configured');
      }
    } catch (error) {
      const logger = require('../../utils/logger');
      logger.error('AI Image Generation error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Generation Failed')
        .setDescription(
          'Failed to generate image. Please try again later.\n\n' +
            'If this persists, contact support on Ko-fi or during the stream.'
        );

      await loadingMsg.edit({ embeds: [errorEmbed] });
    }
  },
};
