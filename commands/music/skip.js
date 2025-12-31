const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  description: 'Skip the current song',
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
      return message.reply('❌ You need to be in the same voice channel as me!');
    }

    if (!queue.playing || queue.songs.length === 0) {
      return message.reply('❌ Nothing is playing right now!');
    }

    const skippedSong = queue.songs[0];
    const success = musicManager.skip(message.guild.id);

    if (success) {
      return message.reply(`⏭️ Skipped **${skippedSong.title}**!`);
    } else {
      return message.reply('❌ Failed to skip the song!');
    }
  },
};
