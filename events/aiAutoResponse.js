const { Events, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const premiumPerks = require('../utils/premiumPerks');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    // Check if server has VIP (AI chat feature)
    if (!premiumPerks.hasFeature(message.guild.id, 'ai_chat')) return;

    // Check if AI auto-response is enabled for this channel
    const aiSettings = db.get('ai_chat_settings', message.guild.id);
    if (!aiSettings || !aiSettings.enabled) return;
    if (aiSettings.channelId !== message.channel.id) return;

    // Ignore command messages
    if (message.content.startsWith('//')) return;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) return;

    // Only respond if bot is mentioned or message is a reply to bot
    const botMentioned = message.mentions.has(message.client.user);
    const isReplyToBot =
      message.reference &&
      (
        await message.channel.messages
          .fetch(message.reference.messageId)
          .catch(() => null)
      )?.author?.id === message.client.user.id;

    if (!botMentioned && !isReplyToBot) return;

    // Send typing indicator
    await message.channel.sendTyping();

    try {
      const axios = require('axios');

      // Get conversation history
      const conversationKey = `ai_conversation_${message.author.id}`;
      const conversation = db.get('ai_conversations', conversationKey) || [];

      // Clean message content (remove bot mention)
      const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();

      if (!cleanContent) return;

      // Add user message to history
      conversation.push({
        role: 'user',
        content: cleanContent,
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
          .setFooter({
            text: '👑 VIP Feature | Powered by OpenAI GPT-3.5',
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('AI Auto-response error:', error);
      // Silently fail for auto-responses
    }
  },
};
