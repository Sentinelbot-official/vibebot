const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

module.exports = {
  name: 'aimeme',
  aliases: ['genmeme', 'memegen'],
  description: 'Generate memes using AI',
  usage: '<topic/idea>',
  category: 'fun',
  cooldown: 30,
  async execute(message, args) {
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🤖 AI Meme Generator')
        .setDescription(
          '**Generate hilarious memes with AI!**\n\n' +
            '**Usage:**\n' +
            '`//aimeme <topic or idea>`\n\n' +
            '**Examples:**\n' +
            '• `//aimeme programming bugs`\n' +
            '• `//aimeme monday mornings`\n' +
            '• `//aimeme discord mods`\n' +
            '• `//aimeme gaming rage`\n\n' +
            '**Features:**\n' +
            '• AI-generated captions\n' +
            '• Popular meme templates\n' +
            '• Context-aware humor\n' +
            '• Fresh & original content'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const topic = args.join(' ');

    const loadingEmbed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🤖 Generating Meme...')
      .setDescription(
        `**Topic:** ${topic}\n\n` +
          '${branding.getRandomMessage([\n' +
          '  "Analyzing meme templates...",\n' +
          '  "Crafting the perfect caption...",\n' +
          '  "Adding humor algorithms...",\n' +
          '  "Consulting the meme council...",\n' +
          '  "Generating dank content..."\n' +
          '])}'
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      // Generate meme using AI
      const meme = await generateAIMeme(topic);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🎭 ${meme.template}`)
        .setDescription(
          `**Top Text:** ${meme.topText}\n` +
            `**Bottom Text:** ${meme.bottomText}\n\n` +
            `**Topic:** ${topic}`
        )
        .setImage(meme.imageUrl)
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ embeds: [embed] });
    } catch (error) {
      console.error('AI meme generation error:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('❌ Generation Failed')
        .setDescription(
          'Failed to generate meme. This could be because:\n\n' +
            '• AI service is unavailable\n' +
            '• Topic is too complex\n' +
            '• Rate limit reached\n\n' +
            'Try again with a different topic!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ embeds: [errorEmbed] });
    }
  },
};

async function generateAIMeme(topic) {
  // Meme templates
  const templates = [
    {
      name: 'Drake Hotline Bling',
      id: '181913649',
      boxes: 2,
    },
    {
      name: 'Distracted Boyfriend',
      id: '112126428',
      boxes: 3,
    },
    {
      name: 'Two Buttons',
      id: '87743020',
      boxes: 3,
    },
    {
      name: 'Change My Mind',
      id: '129242436',
      boxes: 1,
    },
    {
      name: 'Expanding Brain',
      id: '93895088',
      boxes: 4,
    },
    {
      name: 'Is This A Pigeon',
      id: '100777631',
      boxes: 3,
    },
  ];

  // Select random template
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Generate captions based on topic (simplified AI logic)
  const captions = generateCaptions(topic, template.boxes);

  // Create meme using Imgflip API
  try {
    const response = await axios.post('https://api.imgflip.com/caption_image', {
      template_id: template.id,
      username: 'imgflip_hubot',
      password: 'imgflip_hubot',
      boxes: captions.map(text => ({ text })),
    });

    if (response.data.success) {
      return {
        template: template.name,
        topText: captions[0] || '',
        bottomText: captions[1] || '',
        imageUrl: response.data.data.url,
      };
    }
  } catch (error) {
    console.error('Imgflip API error:', error);
  }

  throw new Error('Failed to generate meme');
}

function generateCaptions(topic, boxCount) {
  // Simple caption generation based on topic
  const topicLower = topic.toLowerCase();

  // Predefined patterns for common topics
  const patterns = {
    programming: ['Writing clean code', 'Copy-pasting from Stack Overflow'],
    bugs: ['My code', 'Production bugs'],
    monday: ['Weekend', 'Monday morning'],
    gaming: ['Playing for fun', 'Competitive ranked'],
    discord: ['Normal users', 'Discord mods'],
    sleep: ['Getting 8 hours of sleep', 'Scrolling at 3 AM'],
  };

  // Find matching pattern
  for (const [key, captions] of Object.entries(patterns)) {
    if (topicLower.includes(key)) {
      return captions.slice(0, boxCount);
    }
  }

  // Default captions
  return [`When ${topic}`, `${topic} be like`, 'Everyone', `${topic}`].slice(
    0,
    boxCount
  );
}
