const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ai',
  description: 'Chat with AI (requires API key)',
  usage: '<message>',
  aliases: ['chat', 'gpt'],
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a message!\nUsage: `ai <your message>`'
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ AI Not Configured')
        .setDescription('This feature requires an API key to be configured.')
        .addFields(
          {
            name: 'Setup Instructions',
            value:
              'Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to your .env file',
            inline: false,
          },
          {
            name: 'Get API Keys',
            value:
              '[OpenAI](https://platform.openai.com) or [Anthropic](https://anthropic.com)',
            inline: false,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Placeholder for actual AI implementation
    return message.reply(
      '🤖 AI chat feature is configured but not yet implemented. Add your preferred AI library (openai, @anthropic-ai/sdk, etc.) and implement the chat logic here.'
    );
  },
};
