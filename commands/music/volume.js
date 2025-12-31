const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'volume',
  aliases: ['vol', 'v'],
  description: 'Adjust the music volume',
  usage: '<0-100>',
  category: 'music',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const queue = musicManager.getQueue(message.guild.id);

    if (!message.member.voice.channel) {
      return message.reply('❌ You need to be in a voice channel!');
    }

    if (!queue.voiceChannel) {
      return message.reply('❌ I am not playing anything!');
    }

    if (message.member.voice.channel.id !== queue.voiceChannel.id) {
      return message.reply(
        '❌ You need to be in the same voice channel as me!'
      );
    }

    if (!args[0]) {
      return message.reply(
        `🔊 Current volume: **${queue.volume}%**\n\nUse \`//volume <0-100>\` to change it.`
      );
    }

    const volume = parseInt(args[0]);

    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.reply('❌ Volume must be a number between 0 and 100!');
    }

    const success = musicManager.setVolume(message.guild.id, volume);

    if (success) {
      return message.reply(`🔊 Volume set to **${volume}%**!`);
    } else {
      return message.reply('❌ Failed to set volume!');
    }
  },
};
