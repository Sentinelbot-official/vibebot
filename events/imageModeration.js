const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const branding = require('../utils/branding');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // Check if image moderation is enabled
    const config = db.get('image_moderation', message.guild.id);
    if (!config || !config.enabled) return;

    // Check if message has image attachments
    const imageAttachments = message.attachments.filter(att =>
      att.contentType?.startsWith('image/')
    );

    if (imageAttachments.size === 0) return;

    // Check if OpenAI API is available
    if (!process.env.OPENAI_API_KEY) return;

    try {
      for (const [_, attachment] of imageAttachments) {
        const analysis = await analyzeImage(attachment.url);

        if (analysis.isNSFW && config.blockNSFW) {
          // Delete message
          try {
            await message.delete();
          } catch (error) {
            console.error('Failed to delete message:', error);
          }

          // Warn user
          try {
            const dmEmbed = new EmbedBuilder()
              .setColor(branding.colors.error)
              .setTitle('⚠️ Image Removed')
              .setDescription(
                `Your image in **${message.guild.name}** was removed by AI moderation.\n\n` +
                  `**Reason:** NSFW content detected\n` +
                  `**Confidence:** ${(analysis.confidence * 100).toFixed(0)}%\n\n` +
                  'Please review the server rules before posting images.'
              )
              .setFooter(branding.footers.default)
              .setTimestamp();

            await message.author.send({ embeds: [dmEmbed] });
          } catch (error) {
            // User has DMs disabled
          }

          // Log to channel
          if (config.logChannel) {
            const logChannel = message.guild.channels.cache.get(
              config.logChannel
            );
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setColor(branding.colors.error)
                .setTitle('🖼️ Image Moderation Action')
                .setDescription(
                  `**User:** ${message.author} (${message.author.tag})\n` +
                    `**Channel:** ${message.channel}\n` +
                    `**Reason:** NSFW content detected\n` +
                    `**Confidence:** ${(analysis.confidence * 100).toFixed(0)}%\n` +
                    `**Action:** Image deleted`
                )
                .setImage(attachment.url)
                .setFooter(branding.footers.default)
                .setTimestamp();

              await logChannel.send({ embeds: [logEmbed] });
            }
          }

          // Update stats
          const stats = db.get('image_mod_stats', message.guild.id) || {
            totalScans: 0,
            totalBlocked: 0,
          };
          stats.totalScans++;
          stats.totalBlocked++;
          db.set('image_mod_stats', message.guild.id, stats);

          break; // Stop checking other images
        }
      }
    } catch (error) {
      console.error('Image moderation error:', error);
    }
  },
};

async function analyzeImage(imageUrl) {
  try {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text:
                    'Analyze this image for NSFW content. Respond with ONLY "SAFE" or "NSFW" followed by a confidence score (0.0-1.0).\n' +
                    'Format: "SAFE 0.95" or "NSFW 0.85"\n' +
                    'Consider: nudity, sexual content, violence, gore, disturbing imagery.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 50,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const result = data.choices[0].message.content.trim();

    // Parse response
    const [rating, confidenceStr] = result.split(' ');
    const confidence = parseFloat(confidenceStr) || 0.5;

    return {
      isNSFW: rating === 'NSFW',
      confidence,
    };
  } catch (error) {
    console.error('Image analysis error:', error);
    return { isNSFW: false, confidence: 0 };
  }
}
