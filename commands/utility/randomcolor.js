const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  name: 'randomcolor',
  description: 'Generate a random color',
  usage: '',
  aliases: ['randcolor', 'colorgen'],
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    // Generate random color
    const randomColor = Math.floor(Math.random() * 16777215);
    const hexColor = `#${randomColor.toString(16).padStart(6, '0')}`;

    // Convert to RGB
    const r = (randomColor >> 16) & 255;
    const g = (randomColor >> 8) & 255;
    const b = randomColor & 255;

    // Convert to HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case rNorm:
          h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
          break;
        case gNorm:
          h = ((bNorm - rNorm) / d + 2) / 6;
          break;
        case bNorm:
          h = ((rNorm - gNorm) / d + 4) / 6;
          break;
      }
    }

    const hDeg = Math.round(h * 360);
    const sPercent = Math.round(s * 100);
    const lPercent = Math.round(l * 100);

    const embed = new EmbedBuilder()
      .setColor(randomColor)
      .setTitle('🎨 Random Color Generator')
      .addFields(
        {
          name: 'HEX',
          value: `\`${hexColor.toUpperCase()}\``,
          inline: true,
        },
        {
          name: 'RGB',
          value: `\`rgb(${r}, ${g}, ${b})\``,
          inline: true,
        },
        {
          name: 'HSL',
          value: `\`hsl(${hDeg}, ${sPercent}%, ${lPercent}%)\``,
          inline: true,
        },
        {
          name: 'Decimal',
          value: `\`${randomColor}\``,
          inline: true,
        }
      )
      .setDescription(`**Color Preview:**\n${'█'.repeat(20)}`)
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
