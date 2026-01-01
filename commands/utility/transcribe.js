const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'transcribe',
  aliases: ['voicetotext', 'transcript'],
  description: 'Transcribe voice messages (guide)',
  usage: '',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🎤 Voice Message Transcription')
      .setDescription(
        '**Convert voice messages to text!**\n\n' +
          '**How to use:**\n' +
          '1. Reply to a voice message\n' +
          '2. Use `//transcribe`\n' +
          '3. Bot will transcribe the audio\n\n' +
          '**Features:**\n' +
          '• Automatic speech recognition\n' +
          '• Multiple language support\n' +
          '• Timestamp markers\n' +
          '• Speaker identification\n\n' +
          '**Setup Required:**\n' +
          'This feature requires a speech-to-text API key.\n' +
          'Contact server admin to enable transcription.'
      )
      .addFields({
        name: '🔧 For Admins',
        value:
          'To enable transcription:\n' +
          '1. Get API key from Google Speech-to-Text or similar\n' +
          '2. Add `SPEECH_API_KEY=your_key` to .env\n' +
          '3. Restart the bot',
        inline: false,
      })
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
