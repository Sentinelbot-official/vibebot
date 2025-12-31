const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'resume',
  aliases: ['unpause'],
  description: 'Resume the paused song',
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
      return message.reply(
        '❌ You need to be in the same voice channel as me!'
      );
    }

    const success = musicManager.resume(message.guild.id);

    if (success) {
      return message.reply('▶️ Resumed the music!');
    } else {
      return message.reply('❌ Failed to resume the music!');
    }
  },
};
