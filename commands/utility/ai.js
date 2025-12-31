const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ai',
  aliases: ['ask', 'chatgpt', 'gpt'],
  description: 'Ask AI a question (placeholder - requires API)',
  usage: '<question>',
  category: 'utility',
  cooldown: 10,
  execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Please provide a question!');
    }

    const question = args.join(' ');

    // This is a placeholder - you would integrate with OpenAI, Claude, or other AI API

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🤖 AI Assistant')
      .setDescription(
        '⚠️ **AI API Not Configured**\n\n' +
          'To use this command, you need to:\n' +
          '1. Get an API key from OpenAI, Anthropic, or similar\n' +
          '2. Add `OPENAI_API_KEY=your_key` to .env\n' +
          '3. Install: `npm install openai`\n' +
          '4. Update this command with API integration'
      )
      .addFields(
        {
          name: 'Your Question',
          value: question.substring(0, 1024),
          inline: false,
        },
        {
          name: 'Recommended APIs',
          value:
            '• [OpenAI API](https://platform.openai.com/) (GPT-4, GPT-3.5)\n• [Anthropic Claude](https://www.anthropic.com/api)\n• [Google Gemini](https://ai.google.dev/)\n• [Groq](https://groq.com/) (Fast & Free)',
          inline: false,
        }
      );

    message.reply({ embeds: [embed] });
  },
};
