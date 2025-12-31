const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'imagine',
  description: 'Generate images with AI (requires API key)',
  usage: '<prompt>',
  aliases: ['generate', 'imggen'],
  category: 'utility',
  cooldown: 30,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a prompt!\nUsage: `imagine <description>`\nExample: `imagine a cat in space`'
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const stabilityKey = process.env.STABILITY_API_KEY;

    if (!openaiKey && !stabilityKey) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Image Generation Not Configured')
        .setDescription('This feature requires an API key.')
        .addFields(
          {
            name: 'Setup',
            value: 'Add `OPENAI_API_KEY` or `STABILITY_API_KEY` to .env',
            inline: false,
          },
          {
            name: 'Get Keys',
            value:
              '[OpenAI](https://platform.openai.com) or [Stability AI](https://stability.ai)',
            inline: false,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const prompt = args.join(' ');
    const generatingMsg = await message.reply('🎨 Generating image...');

    try {
      // Try OpenAI DALL-E first
      if (openaiKey) {
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
              Authorization: `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 second timeout
          }
        );

        const imageUrl = response.data.data[0].url;
        const revisedPrompt = response.data.data[0].revised_prompt;

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎨 AI Generated Image')
          .setDescription(`**Your Prompt:** ${prompt.substring(0, 200)}`)
          .addFields({
            name: 'Revised Prompt',
            value: revisedPrompt.substring(0, 1024),
          })
          .setImage(imageUrl)
          .setFooter({ text: 'Powered by DALL-E 3' })
          .setTimestamp();

        return generatingMsg.edit({ content: null, embeds: [embed] });
      }

      // Try Stability AI if OpenAI not available
      if (stabilityKey) {
        const response = await axios.post(
          'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
          {
            text_prompts: [{ text: prompt, weight: 1 }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30,
          },
          {
            headers: {
              Authorization: `Bearer ${stabilityKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 60000,
          }
        );

        // Stability AI returns base64 image
        const base64Image = response.data.artifacts[0].base64;
        const buffer = Buffer.from(base64Image, 'base64');

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎨 AI Generated Image')
          .setDescription(`**Prompt:** ${prompt.substring(0, 200)}`)
          .setFooter({ text: 'Powered by Stability AI' })
          .setTimestamp();

        return generatingMsg.edit({
          content: null,
          embeds: [embed],
          files: [{ attachment: buffer, name: 'generated.png' }],
        });
      }
    } catch (error) {
      console.error('Image Gen Error:', error.response?.data || error.message);

      let errorMsg = 'Failed to generate image. ';

      if (error.response?.status === 400) {
        errorMsg += 'Invalid prompt or parameters.';
      } else if (error.response?.status === 401) {
        errorMsg += 'Invalid API key.';
      } else if (error.response?.status === 429) {
        errorMsg += 'Rate limit exceeded. Try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMsg += 'Request timed out. Try a simpler prompt.';
      } else {
        errorMsg +=
          error.response?.data?.error?.message || 'Check your API key and quota.';
      }

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Image Generation Error')
        .setDescription(errorMsg)
        .setTimestamp();

      return generatingMsg.edit({ content: null, embeds: [errorEmbed] });
    }
  },
};
