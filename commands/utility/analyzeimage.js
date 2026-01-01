const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'analyzeimage',
  description: 'Analyze an image with AI (objects, text, NSFW detection)',
  usage: '//analyzeimage <image_url or attach image>',
  aliases: ['imageai', 'scanimage', 'imganalyze'],
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!process.env.OPENAI_API_KEY) {
      return message.reply(
        '❌ This feature requires an OpenAI API key to be configured!'
      );
    }

    // Get image URL from args or attachments
    let imageUrl = args[0];

    if (!imageUrl && message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (attachment.contentType?.startsWith('image/')) {
        imageUrl = attachment.url;
      }
    }

    if (!imageUrl) {
      return message.reply(
        '❌ Please provide an image URL or attach an image!\n' +
          'Usage: `//analyzeimage <url>` or attach an image'
      );
    }

    const loadingMsg = await message.reply('🔍 Analyzing image...');

    try {
      // Use OpenAI Vision API
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
                      'Analyze this image and provide:\n' +
                      '1. A brief description of what you see\n' +
                      '2. Main objects/subjects in the image\n' +
                      '3. Any text visible in the image\n' +
                      '4. Overall mood/tone\n' +
                      '5. Content rating (Safe/Questionable/NSFW)\n\n' +
                      'Format your response clearly with these categories.',
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
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;

      // Check for NSFW content
      const isNSFW =
        analysis.toLowerCase().includes('nsfw') ||
        analysis.toLowerCase().includes('explicit') ||
        analysis.toLowerCase().includes('inappropriate');

      const embed = new EmbedBuilder()
        .setColor(isNSFW ? branding.colors.error : branding.colors.primary)
        .setTitle(isNSFW ? '⚠️ Image Analysis (NSFW Detected)' : '🔍 Image Analysis')
        .setDescription(analysis)
        .setImage(imageUrl)
        .setFooter(branding.footers.default)
        .setTimestamp();

      if (isNSFW) {
        embed.addFields({
          name: '⚠️ Warning',
          value:
            'This image may contain NSFW content. Please review server rules.',
          inline: false,
        });
      }

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Image analysis error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('❌ Analysis Failed')
        .setDescription(
          `Failed to analyze image: ${error.message}\n\n` +
            '**Possible reasons:**\n' +
            '• Invalid image URL\n' +
            '• Image too large\n' +
            '• API rate limit reached\n' +
            '• Unsupported image format'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [errorEmbed] });
    }
  },
};
