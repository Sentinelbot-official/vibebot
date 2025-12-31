const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'translate',
  description: 'Translate text to another language (mock translation)',
  usage: '<language> <text>',
  aliases: ['tr', 'trans'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `translate <language> <text>`\n' +
          'Example: `translate es Hello world`\n' +
          'Supported: es (Spanish), fr (French), de (German), it (Italian), pt (Portuguese), ja (Japanese)'
      );
    }

    const targetLang = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    // Mock translations (simple word replacements for demo)
    const translations = {
      es: {
        hello: 'hola',
        world: 'mundo',
        good: 'bueno',
        morning: 'mañana',
        night: 'noche',
        thank: 'gracias',
        you: 'tú',
        please: 'por favor',
      },
      fr: {
        hello: 'bonjour',
        world: 'monde',
        good: 'bon',
        morning: 'matin',
        night: 'nuit',
        thank: 'merci',
        you: 'vous',
        please: "s'il vous plaît",
      },
      de: {
        hello: 'hallo',
        world: 'welt',
        good: 'gut',
        morning: 'morgen',
        night: 'nacht',
        thank: 'danke',
        you: 'du',
        please: 'bitte',
      },
      it: {
        hello: 'ciao',
        world: 'mondo',
        good: 'buono',
        morning: 'mattina',
        night: 'notte',
        thank: 'grazie',
        you: 'tu',
        please: 'per favore',
      },
      pt: {
        hello: 'olá',
        world: 'mundo',
        good: 'bom',
        morning: 'manhã',
        night: 'noite',
        thank: 'obrigado',
        you: 'você',
        please: 'por favor',
      },
      ja: {
        hello: 'こんにちは',
        world: '世界',
        good: '良い',
        morning: '朝',
        night: '夜',
        thank: 'ありがとう',
        you: 'あなた',
        please: 'お願いします',
      },
    };

    if (!translations[targetLang]) {
      return message.reply(
        '❌ Unsupported language! Supported: es, fr, de, it, pt, ja'
      );
    }

    // Simple word-by-word translation (mock)
    const words = text.toLowerCase().split(' ');
    const translated = words
      .map(word => {
        const cleanWord = word.replace(/[.,!?]/g, '');
        return translations[targetLang][cleanWord] || word;
      })
      .join(' ');

    const languageNames = {
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ja: 'Japanese',
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🌐 Translation')
      .addFields(
        {
          name: 'Original',
          value: text,
          inline: false,
        },
        {
          name: `Translated (${languageNames[targetLang]})`,
          value: translated,
          inline: false,
        }
      )
      .setFooter({
        text: 'Note: This is a basic mock translation for demonstration',
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
