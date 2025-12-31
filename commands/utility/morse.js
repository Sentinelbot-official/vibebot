const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'morse',
  description: 'Convert text to/from morse code',
  usage: '<encode|decode> <text>',
  aliases: ['morsecode'],
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `morse <encode|decode> <text>`\n' +
          'Example: `morse encode hello` or `morse decode .... . .-.. .-.. ---`'
      );
    }

    const action = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    const morseCode = {
      a: '.-',
      b: '-...',
      c: '-.-.',
      d: '-..',
      e: '.',
      f: '..-.',
      g: '--.',
      h: '....',
      i: '..',
      j: '.---',
      k: '-.-',
      l: '.-..',
      m: '--',
      n: '-.',
      o: '---',
      p: '.--.',
      q: '--.-',
      r: '.-.',
      s: '...',
      t: '-',
      u: '..-',
      v: '...-',
      w: '.--',
      x: '-..-',
      y: '-.--',
      z: '--..',
      0: '-----',
      1: '.----',
      2: '..---',
      3: '...--',
      4: '....-',
      5: '.....',
      6: '-....',
      7: '--...',
      8: '---..',
      9: '----.',
      ' ': '/',
    };

    let result;

    if (action === 'encode') {
      result = text
        .toLowerCase()
        .split('')
        .map(char => morseCode[char] || char)
        .join(' ');
    } else if (action === 'decode') {
      const reverseMorse = Object.fromEntries(
        Object.entries(morseCode).map(([k, v]) => [v, k])
      );

      result = text
        .split(' ')
        .map(code => reverseMorse[code] || code)
        .join('');
    } else {
      return message.reply('❌ Action must be either `encode` or `decode`!');
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('📡 Morse Code')
      .addFields(
        {
          name: action === 'encode' ? 'Text' : 'Morse Code',
          value: text.substring(0, 1024),
          inline: false,
        },
        {
          name: action === 'encode' ? 'Morse Code' : 'Text',
          value: result.substring(0, 1024),
          inline: false,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
