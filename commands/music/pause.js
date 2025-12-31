const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'pause',
  description: 'Pause the currently playing song',
  category: 'music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
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

    if (!queue.playing) {
      return message.reply('❌ Nothing is playing right now!');
    }

    const success = musicManager.pause(message.guild.id);

    if (success) {
      return message.reply('⏸️ Paused the music!');
    } else {
      return message.reply('❌ Failed to pause the music!');
    }
  },
};
