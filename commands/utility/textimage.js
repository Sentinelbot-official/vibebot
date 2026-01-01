const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const branding = require('../../utils/branding');

const styles = {
  neon: { name: 'Neon Glow', emoji: '💡', color: '#00ff00' },
  fire: { name: 'Fire', emoji: '🔥', color: '#ff4500' },
  ice: { name: 'Ice', emoji: '❄️', color: '#00bfff' },
  gold: { name: 'Gold', emoji: '🏆', color: '#ffd700' },
  rainbow: { name: 'Rainbow', emoji: '🌈', color: '#ff69b4' },
  glitch: { name: 'Glitch', emoji: '⚡', color: '#ff00ff' },
  retro: { name: 'Retro', emoji: '📺', color: '#ff1493' },
  metal: { name: 'Metal', emoji: '🔩', color: '#c0c0c0' },
  wood: { name: 'Wood', emoji: '🪵', color: '#8b4513' },
  stone: { name: 'Stone', emoji: '🗿', color: '#808080' },
};

module.exports = {
  name: 'textimage',
  aliases: ['textart', 'textlogo', 'banner'],
  description: 'Create stylized text images',
  usage: '<style> <text>',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const styleName = args[0]?.toLowerCase();

    if (!styleName || !styles[styleName]) {
      const styleList = Object.entries(styles)
        .map(([key, val]) => `${val.emoji} \`${key}\` - ${val.name}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('✨ Text Image Creator')
        .setDescription(
          '**Create stunning text images with effects!**\n\n' +
            '**Available Styles:**\n' +
            styleList +
            '\n\n**Usage:**\n' +
            '`//textimage <style> <your text>`\n\n' +
            '**Examples:**\n' +
            '• `//textimage neon Vibe Bot`\n' +
            '• `//textimage fire EPIC GAMER`\n' +
            '• `//textimage rainbow Happy Birthday!`\n\n' +
            '**Tips:**\n' +
            '• Keep text short (1-20 characters)\n' +
            '• Use ALL CAPS for impact\n' +
            '• Avoid special characters'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const text = args.slice(1).join(' ');

    if (!text) {
      return message.reply(
        `❌ Please provide text to stylize!\n` +
          `Example: \`//textimage ${styleName} Your Text Here\``
      );
    }

    if (text.length > 50) {
      return message.reply(
        '❌ Text too long! Please keep it under 50 characters.'
      );
    }

    const loading = await message.reply(
      `${branding.emojis.loading} Creating **${styles[styleName].name}** text image...`
    );

    try {
      const style = styles[styleName];

      // Provide creation guide with tools and examples
      const embed = new EmbedBuilder()
        .setColor(style.color)
        .setTitle(`${style.emoji} ${style.name} Text Image`)
        .setDescription(
          `**Text:** "${text}"\n` +
            `**Style:** ${style.name}\n\n` +
            '**Create this using:**'
        )
        .addFields(
          {
            name: '🌐 Online Tools (Free & Easy)',
            value:
              '• [Cooltext.com](https://cooltext.com/) - Instant logos\n' +
              '• [Flamingtext.com](https://flamingtext.com/) - Animated text\n' +
              '• [Textcraft.net](https://textcraft.net/) - Gaming style\n' +
              '• [Maketext.io](https://maketext.io/) - Quick & simple',
            inline: false,
          },
          {
            name: '🎨 Advanced Tools',
            value:
              '• [Canva](https://canva.com) - Professional templates\n' +
              '• [Photopea](https://photopea.com) - Photoshop-like\n' +
              '• [Pixlr](https://pixlr.com) - Online editor\n' +
              '• [Figma](https://figma.com) - Design tool',
            inline: false,
          },
          {
            name: '📱 Mobile Apps',
            value:
              '• **Phonto** (iOS/Android) - Text on photos\n' +
              '• **Over** (iOS/Android) - Graphic design\n' +
              '• **Canva** (iOS/Android) - Templates\n' +
              '• **Adobe Spark** (iOS/Android) - Quick graphics',
            inline: false,
          },
          {
            name: `⚡ Quick Method for "${styleName}" Style`,
            value: getQuickMethod(styleName, text),
            inline: false,
          },
          {
            name: '💡 Style Tips',
            value: getStyleTips(styleName),
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Cooltext.com')
          .setStyle(ButtonStyle.Link)
          .setURL('https://cooltext.com/')
          .setEmoji('🎨'),
        new ButtonBuilder()
          .setLabel('Canva')
          .setStyle(ButtonStyle.Link)
          .setURL('https://www.canva.com/create/logos/')
          .setEmoji('✨'),
        new ButtonBuilder()
          .setLabel('Textcraft')
          .setStyle(ButtonStyle.Link)
          .setURL('https://textcraft.net/')
          .setEmoji('🎮')
      );

      return loading.edit({
        content:
          '✨ **Text image creation guide ready!**\n' +
          'Click the buttons below for quick access to tools:',
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error('Text image error:', error);
      return loading.edit(
        `${branding.emojis.error} Failed to generate guide! Please try again.`
      );
    }
  },
};

function getQuickMethod(style, text) {
  const methods = {
    neon: `1. Go to [Cooltext.com](https://cooltext.com/)\n2. Choose "Neon" category\n3. Type "${text}"\n4. Pick green/cyan colors\n5. Download!`,
    fire: `1. Go to [Flamingtext.com](https://flamingtext.com/)\n2. Choose "Burning" effect\n3. Type "${text}"\n4. Adjust flame colors\n5. Download!`,
    ice: `1. Go to [Cooltext.com](https://cooltext.com/)\n2. Choose "Frozen" style\n3. Type "${text}"\n4. Use blue/white colors\n5. Download!`,
    gold: `1. Go to [Textcraft.net](https://textcraft.net/)\n2. Choose "Gold" texture\n3. Type "${text}"\n4. Add shine effect\n5. Download!`,
    rainbow: `1. Go to [Maketext.io](https://maketext.io/)\n2. Choose "Rainbow" gradient\n3. Type "${text}"\n4. Adjust colors\n5. Download!`,
    glitch: `1. Go to [Photopea.com](https://photopea.com/)\n2. Create text layer\n3. Duplicate & offset with RGB\n4. Add distortion\n5. Export!`,
    retro: `1. Go to [Cooltext.com](https://cooltext.com/)\n2. Choose "Retro" or "80s" style\n3. Type "${text}"\n4. Use pink/purple colors\n5. Download!`,
    metal: `1. Go to [Textcraft.net](https://textcraft.net/)\n2. Choose "Metal" texture\n3. Type "${text}"\n4. Add reflection\n5. Download!`,
    wood: `1. Go to [Cooltext.com](https://cooltext.com/)\n2. Choose "Wood" texture\n3. Type "${text}"\n4. Adjust grain\n5. Download!`,
    stone: `1. Go to [Textcraft.net](https://textcraft.net/)\n2. Choose "Stone" texture\n3. Type "${text}"\n4. Add weathering\n5. Download!`,
  };

  return methods[style] || 'Use any tool above to create your styled text!';
}

function getStyleTips(style) {
  const tips = {
    neon: '• Use dark background\n• Add glow/blur effect\n• Bright colors work best',
    fire: '• Orange/red/yellow gradient\n• Add motion blur\n• Distort edges',
    ice: '• Light blue/white colors\n• Add transparency\n• Sharp edges',
    gold: '• Yellow/orange gradient\n• Add shine/reflection\n• Metallic texture',
    rainbow:
      '• Smooth color transition\n• Bright, saturated colors\n• Gradient overlay',
    glitch: '• RGB channel split\n• Digital distortion\n• Scanline effect',
    retro:
      '• Pink/purple/cyan colors\n• Grid background\n• Synthwave aesthetic',
    metal: '• Silver/gray colors\n• High contrast\n• Reflective surface',
    wood: '• Brown tones\n• Grain texture\n• Natural look',
    stone: '• Gray tones\n• Rough texture\n• 3D depth',
  };

  return (
    tips[style] ||
    '• Experiment with colors\n• Try different fonts\n• Add effects'
  );
}
