const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'imagine',
  description: 'Generate images with AI (requires API key)',
  usage: '<prompt>',
  aliases: ['generate', 'image'],
  category: 'utility',
  cooldown: 30,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a prompt!\nUsage: `imagine <description>`\nExample: `imagine a cat in space`'
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY;

    if (!apiKey) {
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

    return message.reply(
      '🎨 Image generation is configured but not yet implemented. Add your preferred image generation library and implement the logic here.'
    );
  },
};
