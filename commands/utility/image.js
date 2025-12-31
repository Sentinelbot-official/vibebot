const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'image',
  aliases: ['img', 'generate', 'dalle'],
  description: 'Generate an image with AI (placeholder - requires API)',
  usage: '<prompt>',
  category: 'utility',
  cooldown: 30,
  execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Please provide an image prompt!');
    }

    const prompt = args.join(' ');

    // This is a placeholder - you would integrate with an AI image generation API

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🎨 AI Image Generation')
      .setDescription(
        '⚠️ **Image Generation API Not Configured**\n\n' +
          'To use this command, you need to:\n' +
          '1. Get an API key from an AI image provider\n' +
          '2. Add API key to .env\n' +
          '3. Install required packages\n' +
          '4. Update this command with API integration'
      )
      .addFields(
        {
          name: 'Your Prompt',
          value: prompt.substring(0, 1024),
          inline: false,
        },
        {
          name: 'Recommended APIs',
          value:
            '• [OpenAI DALL-E](https://platform.openai.com/docs/guides/images)\n• [Stability AI](https://stability.ai/)\n• [Replicate](https://replicate.com/) (SDXL, Flux)\n• [Hugging Face](https://huggingface.co/models?pipeline_tag=text-to-image)',
          inline: false,
        }
      );

    message.reply({ embeds: [embed] });
  },
};
