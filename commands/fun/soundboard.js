const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'soundboard',
  aliases: ['sound', 'sfx'],
  description: 'Play sound effects in voice',
  usage: '<sound_name>',
  category: 'fun',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🔊 Soundboard')
      .setDescription(
        '**Play fun sound effects!**\n\n' +
          '**Available Sounds:**\n' +
          '🎺 `airhorn` - Classic airhorn\n' +
          '🥁 `drumroll` - Drumroll please\n' +
          '🎉 `tada` - Celebration\n' +
          '😂 `laugh` - Laugh track\n' +
          '📢 `bruh` - Bruh moment\n' +
          '🎵 `rickroll` - Never gonna...\n' +
          '🔔 `bell` - Ding ding\n' +
          '👏 `applause` - Clapping\n\n' +
          '**Usage:**\n' +
          '1. Join a voice channel\n' +
          '2. Use `//soundboard <sound>`\n' +
          '3. Bot plays the sound\n\n' +
          '**Note:** Requires voice permissions!'
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
