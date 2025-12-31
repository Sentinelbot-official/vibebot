const { EmbedBuilder } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');

module.exports = {
  name: 'aichat',
  description: 'Chat with AI (VIP only)',
  usage: '//aichat <message> or //aichat toggle',
  aliases: ['ai', 'chatgpt', 'gpt'],
  category: 'premium',
  cooldown: 5,
  async execute(message, args) {
    const guildId = message.guild.id;

    // Check VIP
    if (!premiumPerks.hasFeature(guildId, 'ai_chat')) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ VIP Required')
        .setDescription(
          'This feature requires **VIP**!\n\n' +
            '**VIP Benefits:**\n' +
            '• AI chatbot powered by GPT\n' +
            '• Custom commands\n' +
            '• Auto-posting system\n' +
            '• All Premium features\n' +
            '• And more!\n\n' +
            'Use `//premium` to learn more!'
        )
        .setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ AI Chat Not Configured')
        .setDescription(
          'This feature requires an OpenAI API key to be configured.\n\n' +
            '**Setup:**\n' +
            'Add `OPENAI_API_KEY` to your .env file'
        );

      return message.reply({ embeds: [embed] });
    }

    // Toggle auto-response mode
    if (args[0]?.toLowerCase() === 'toggle') {
      const aiSettings = db.get('ai_chat_settings', guildId) || {
        enabled: false,
        channelId: null,
      };

      aiSettings.enabled = !aiSettings.enabled;
      aiSettings.channelId = message.channel.id;

      db.set('ai_chat_settings', guildId, aiSettings);

      return message.reply(
        `🤖 AI Chat ${aiSettings.enabled ? 'enabled' : 'disabled'} in this channel!\n\n` +
          (aiSettings.enabled
            ? 'The bot will now respond to messages in this channel automatically.'
            : 'The bot will no longer auto-respond in this channel.')
      );
    }

    if (!args.length) {
      const aiSettings = db.get('ai_chat_settings', guildId) || {
        enabled: false,
      };

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🤖 AI Chat')
        .setDescription(
          '**Chat with an AI powered by GPT!**\n\n' +
            '**Usage:**\n' +
            '`//aichat <message>` - Send a message to AI\n' +
            '`//aichat toggle` - Toggle auto-response in this channel\n\n' +
            '**Examples:**\n' +
            '`//aichat What is the meaning of life?`\n' +
            '`//aichat Tell me a joke`\n' +
            '`//aichat Explain quantum physics simply`\n\n' +
            `**Auto-Response:** ${aiSettings.enabled ? '✅ Enabled' : '❌ Disabled'}`
        )
        .setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    const userMessage = args.join(' ');

    // Send typing indicator
    await message.channel.sendTyping();

    try {
      const axios = require('axios');

      // Get conversation history
      const conversationKey = `ai_conversation_${message.author.id}`;
      const conversation = db.get('ai_conversations', conversationKey) || [];

      // Add user message to history
      conversation.push({
        role: 'user',
        content: userMessage,
      });

      // Keep only last 10 messages for context
      const recentConversation = conversation.slice(-10);

      // Call OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful, friendly AI assistant in a Discord server. ' +
                'Keep responses concise (under 2000 characters). ' +
                'Be helpful, informative, and engaging. ' +
                'You are part of Vibe Bot, a multi-purpose Discord bot.',
            },
            ...recentConversation,
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const aiResponse = response.data.choices[0].message.content;

      // Add AI response to history
      conversation.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Save conversation (limit to last 20 messages)
      db.set('ai_conversations', conversationKey, conversation.slice(-20));

      // Split response if too long
      if (aiResponse.length > 2000) {
        const chunks = aiResponse.match(/[\s\S]{1,1900}/g) || [];
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } else {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setAuthor({
            name: 'AI Assistant',
            iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
          })
          .setDescription(aiResponse)
          .setFooter(branding.footers.default)
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      const logger = require('../../utils/logger');
const branding = require('../../utils/branding');
      logger.error('AI Chat error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ AI Chat Error')
        .setDescription(
          'Failed to get AI response. Please try again later.\n\n' +
            'If this persists, contact support on Ko-fi or during the stream.'
        );

      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
