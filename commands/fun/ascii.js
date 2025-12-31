const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ascii',
  description: 'Convert text to ASCII art',
  usage: '<text>',
  aliases: ['asciiart', 'figlet'],
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Usage: `ascii <text>`');
    }

    const text = args.join(' ').substring(0, 10); // Limit to 10 characters

    // Simple ASCII art generator (basic block letters)
    const asciiMap = {
      a: ['  ▄▀▀▄  ', ' ▄▀▀▀▀▄ ', '▀▄    ▄▀', '  ▀▀▀▀  '],
      b: ['▀▀▀▀▀▄  ', '▀▀▀▀▀▄  ', '▄▄▄▄▄▀  ', '        '],
      c: [' ▄▀▀▀▀▄ ', '▐       ', ' ▀▄▄▄▄▀ ', '        '],
      d: ['▀▀▀▀▄   ', '    ▐   ', '▄▄▄▄▀   ', '        '],
      e: ['▀▀▀▀▀▀▀ ', '▀▀▀▀▀   ', '▄▄▄▄▄▄▄ ', '        '],
      f: ['▀▀▀▀▀▀▀ ', '▀▀▀▀▀   ', '▐       ', '        '],
      g: [' ▄▀▀▀▀▄ ', '▐    ▄▀ ', ' ▀▄▄▄▀  ', '        '],
      h: ['▐     ▌ ', '▐▀▀▀▀▀▌ ', '▐     ▌ ', '        '],
      i: ['▀▀▀▀▀▀▀ ', '   ▐    ', '▄▄▄▄▄▄▄ ', '        '],
      j: ['      ▐ ', '      ▐ ', ' ▀▄▄▄▀  ', '        '],
      k: ['▐    ▄▀ ', '▐▀▀▀▄   ', '▐    ▀▄ ', '        '],
      l: ['▐       ', '▐       ', '▀▀▀▀▀▀▀ ', '        '],
      m: ['▐▄   ▄▌ ', '▐ ▀▄▀ ▌ ', '▐     ▌ ', '        '],
      n: ['▐▄    ▌ ', '▐ ▀▄  ▌ ', '▐   ▀▄▌ ', '        '],
      o: [' ▄▀▀▀▄  ', '▐     ▌ ', ' ▀▄▄▄▀  ', '        '],
      p: ['▀▀▀▀▀▄  ', '▐▄▄▄▄▀  ', '▐       ', '        '],
      q: [' ▄▀▀▀▄  ', '▐     ▌ ', ' ▀▄▄▄▀▄ ', '        '],
      r: ['▀▀▀▀▀▄  ', '▐▀▀▀▀▄  ', '▐    ▀▄ ', '        '],
      s: [' ▄▀▀▀▀▄ ', ' ▀▀▀▀▄  ', '▄▄▄▄▄▀  ', '        '],
      t: ['▀▀▀▀▀▀▀ ', '   ▐    ', '   ▐    ', '        '],
      u: ['▐     ▌ ', '▐     ▌ ', ' ▀▄▄▄▀  ', '        '],
      v: ['▐     ▌ ', ' ▀▄ ▄▀  ', '   ▀    ', '        '],
      w: ['▐     ▌ ', '▐ ▄▀▄ ▌ ', '▐▀   ▀▌ ', '        '],
      x: ['▐▄   ▄▌ ', '  ▀▄▀   ', '▄▀   ▀▄ ', '        '],
      y: ['▐▄   ▄▌ ', '  ▀▄▀   ', '   ▐    ', '        '],
      z: ['▀▀▀▀▀▀▄ ', '   ▄▀   ', '▄▀▀▀▀▀▀ ', '        '],
      ' ': ['        ', '        ', '        ', '        '],
      0: [' ▄▀▀▀▄  ', '▐ ▄ ▄ ▌ ', ' ▀▄▄▄▀  ', '        '],
      1: ['   ▄▀   ', '  ▐     ', '▄▄▄▄▄▄▄ ', '        '],
      2: [' ▄▀▀▀▄  ', '   ▄▀   ', '▄▀▀▀▀▀▀ ', '        '],
      3: [' ▄▀▀▀▄  ', '   ▀▀▄  ', ' ▄▄▄▄▀  ', '        '],
      4: ['▐    ▄▀ ', '▀▀▀▀▀▀▄ ', '     ▐  ', '        '],
      5: ['▀▀▀▀▀▀▄ ', ' ▀▀▀▀▄  ', '▄▄▄▄▄▀  ', '        '],
      6: [' ▄▀▀▀▄  ', '▐▀▀▀▀▄  ', ' ▀▄▄▄▀  ', '        '],
      7: ['▀▀▀▀▀▀▄ ', '    ▄▀  ', '   ▐    ', '        '],
      8: [' ▄▀▀▀▄  ', ' ▐▀▀▀▌  ', ' ▀▄▄▄▀  ', '        '],
      9: [' ▄▀▀▀▄  ', ' ▀▄▄▄▄▌ ', ' ▀▄▄▄▀  ', '        '],
    };

    const lines = ['', '', '', ''];
    const chars = text.toLowerCase().split('');

    for (const char of chars) {
      const ascii = asciiMap[char] || asciiMap[' '];
      for (let i = 0; i < 4; i++) {
        lines[i] += ascii[i];
      }
    }

    const asciiArt = lines.join('\n');

    if (asciiArt.length > 2000) {
      return message.reply('❌ Text is too long for ASCII art!');
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('ASCII Art')
      .setDescription('```\n' + asciiArt + '\n```')
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
