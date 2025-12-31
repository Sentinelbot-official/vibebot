const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'stop',
  aliases: ['disconnect', 'dc', 'leave'],
  description: 'Stop the music and clear the queue',
  category: 'music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue = musicManager.getQueue(message.guild.id);

    if (!message.member.voice.channel) {
      return message.reply('❌ You need to be in a voice channel!');
    }

    if (!queue.voiceChannel) {
      return message.reply('❌ I am not in a voice channel!');
    }

    if (message.member.voice.channel.id !== queue.voiceChannel.id) {
      return message.reply('❌ You need to be in the same voice channel as me!');
    }

    musicManager.stop(message.guild.id);
    musicManager.leave(message.guild.id);

    return message.reply('⏹️ Stopped the music and left the voice channel!');
  },
};
