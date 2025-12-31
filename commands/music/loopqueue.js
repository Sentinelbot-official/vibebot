const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'loopqueue',
  aliases: ['lq', 'repeatqueue'],
  description: 'Toggle loop mode for the entire queue',
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

    if (queue.songs.length === 0) {
      return message.reply('❌ Nothing is playing right now!');
    }

    const loopQueueEnabled = musicManager.toggleLoopQueue(message.guild.id);

    if (loopQueueEnabled) {
      return message.reply(
        `🔁 Queue loop enabled! The queue will repeat with **${queue.songs.length}** songs.`
      );
    } else {
      return message.reply('🔁 Queue loop disabled!');
    }
  },
};
