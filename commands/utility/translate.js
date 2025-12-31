const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Language codes mapping
const languageCodes = {
  af: 'Afrikaans',
  sq: 'Albanian',
  ar: 'Arabic',
  hy: 'Armenian',
  az: 'Azerbaijani',
  eu: 'Basque',
  be: 'Belarusian',
  bn: 'Bengali',
  bs: 'Bosnian',
  bg: 'Bulgarian',
  ca: 'Catalan',
  zh: 'Chinese',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  en: 'English',
  et: 'Estonian',
  fi: 'Finnish',
  fr: 'French',
  de: 'German',
  el: 'Greek',
  he: 'Hebrew',
  hi: 'Hindi',
  hu: 'Hungarian',
  is: 'Icelandic',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  lv: 'Latvian',
  lt: 'Lithuanian',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sr: 'Serbian',
  sk: 'Slovak',
  sl: 'Slovenian',
  es: 'Spanish',
  sv: 'Swedish',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
};

module.exports = {
  name: 'translate',
  description: 'Translate text to another language',
  usage: '<language> <text>',
  aliases: ['tr', 'trans'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `translate <language> <text>`\n' +
          'Example: `translate es Hello world`\n' +
          'Popular codes: es (Spanish), fr (French), de (German), ja (Japanese), zh (Chinese), ru (Russian)\n' +
          'Use `translate list` to see all supported languages'
      );
    }

    // List all languages
    if (args[0].toLowerCase() === 'list') {
      const langList = Object.entries(languageCodes)
        .map(([code, name]) => `\`${code}\` - ${name}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle('🌐 Supported Languages')
        .setDescription(langList)
        .setFooter(branding.footers.default)
        .setTimestamp();

      return translatingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Translation error:', error.message);

      // Fallback: Try alternative free API
      try {
        const fallbackResponse = await axios.get(
          `https://api.mymemory.translated.net/get`,
          {
            params: {
              q: text,
              langpair: `auto|${targetLang}`,
            },
            timeout: 10000,
          }
        );

        if (fallbackResponse.data.responseStatus === 200) {
          const translated = fallbackResponse.data.responseData.translatedText;

          const embed = new EmbedBuilder()
            .setColor(branding.colors.info)
            .setTitle('🌐 Translation')
            .addFields(
              {
                name: 'Original',
                value: text.substring(0, 1024),
                inline: false,
              },
              {
                name: `Translated (${languageCodes[targetLang]})`,
                value: translated.substring(0, 1024),
                inline: false,
              }
            )
            .setFooter(branding.footers.default)
            .setTimestamp();

          return translatingMsg.edit({ content: null, embeds: [embed] });
        }
      } catch (fallbackError) {
        console.error('Fallback translation error:', fallbackError.message);
      }

      return translatingMsg.edit(
        '❌ Translation failed. The service may be temporarily unavailable.\n\n' +
          '**For production use**, add Google Cloud Translation API key:\n' +
          '1. Get API key from [Google Cloud Console](https://console.cloud.google.com)\n' +
          '2. Add `GOOGLE_TRANSLATE_API_KEY` to your .env file'
      );
    }
  },
};
