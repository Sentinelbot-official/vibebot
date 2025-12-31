const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

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

    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
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

    const prompt = args.join(' ');
    const thinkingMsg = await message.reply('🤖 Thinking...');

    try {
      let response;

      // Try OpenAI first if key exists
      if (openaiKey) {
        response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful Discord bot assistant. Keep responses concise and friendly.',
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const aiResponse = response.data.choices[0].message.content;

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTitle('💬 Your Question')
          .setDescription(prompt.substring(0, 1024))
          .addFields({
            name: '🤖 AI Response (GPT-3.5)',
            value: aiResponse.substring(0, 1024),
          })
          .setFooter({ text: 'Powered by OpenAI' })
          .setTimestamp();

        return thinkingMsg.edit({ content: null, embeds: [embed] });
      }

      // Try Anthropic if OpenAI not available
      if (anthropicKey) {
        response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
          }
        );

        const aiResponse = response.data.content[0].text;

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTitle('💬 Your Question')
          .setDescription(prompt.substring(0, 1024))
          .addFields({
            name: '🤖 AI Response (Claude)',
            value: aiResponse.substring(0, 1024),
          })
          .setFooter({ text: 'Powered by Anthropic' })
          .setTimestamp();

        return thinkingMsg.edit({ content: null, embeds: [embed] });
      }
    } catch (error) {
      console.error('AI API Error:', error.response?.data || error.message);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ AI Error')
        .setDescription(
          error.response?.data?.error?.message ||
            'Failed to get AI response. Check your API key and quota.'
        )
        .setTimestamp();

      return thinkingMsg.edit({ content: null, embeds: [errorEmbed] });
    }
  },
};
