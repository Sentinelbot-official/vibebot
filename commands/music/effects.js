const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'effects',
  aliases: ['audioeffects', 'filters'],
  description: 'Apply audio effects to music',
  usage: '<bassboost/nightcore/vaporwave/8d/clear>',
  category: 'music',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const effect = args[0]?.toLowerCase();

    if (!effect) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎛️ Audio Effects')
        .setDescription(
          '**Transform your music with audio effects!**\n\n' +
            '**Available Effects:**\n' +
            '🔊 `bassboost` - Enhanced bass\n' +
            '⚡ `nightcore` - Sped up + pitched up\n' +
            '🌊 `vaporwave` - Slowed down + reverb\n' +
            '🎧 `8d` - 8D surround sound\n' +
            '✨ `clear` - Remove all effects\n\n' +
            '**Usage:**\n' +
            '`//effects <effect name>`\n\n' +
            '**Example:**\n' +
            '`//effects bassboost`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const validEffects = ['bassboost', 'nightcore', 'vaporwave', '8d', 'clear'];

    if (!validEffects.includes(effect)) {
      return message.reply(
        '❌ Invalid effect! Use: `bassboost`, `nightcore`, `vaporwave`, `8d`, or `clear`'
      );
    }

    const musicManager = require('../../utils/musicManager');
    const queue = musicManager.getQueue(message.guild.id);

    if (!queue || !queue.currentSong) {
      return message.reply('❌ No music is currently playing!');
    }

    // Apply effect (simplified - in production, use FFmpeg filters)
    if (effect === 'clear') {
      queue.effects = [];
      return message.reply('✅ All audio effects cleared!');
    }

    queue.effects = queue.effects || [];

    if (queue.effects.includes(effect)) {
      return message.reply(`⚠️ ${effect} effect is already active!`);
    }

    queue.effects.push(effect);

    const effectDescriptions = {
      bassboost: '🔊 Bass Boost - Enhanced low frequencies',
      nightcore: '⚡ Nightcore - Sped up and pitched up',
      vaporwave: '🌊 Vaporwave - Slowed down with reverb',
      '8d': '🎧 8D Audio - Surround sound experience',
    };

    const embed = new EmbedBuilder()
      .setColor(branding.colors.success)
      .setTitle('✅ Effect Applied!')
      .setDescription(
        `${effectDescriptions[effect]}\n\n` +
          `**Active Effects:** ${queue.effects.join(', ')}\n\n` +
          '_Note: Effects will apply to the next song. Current song may need to be skipped._'
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
