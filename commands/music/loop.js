const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'loop',
  aliases: ['repeat'],
  description: 'Toggle loop mode for the current song',
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

    if (queue.songs.length === 0) {
      return message.reply('❌ Nothing is playing right now!');
    }

    const loopEnabled = musicManager.toggleLoop(message.guild.id);

    if (loopEnabled) {
      return message.reply(`🔂 Loop enabled! **${queue.songs[0].title}** will repeat.`);
    } else {
      return message.reply('🔁 Loop disabled!');
    }
  },
};
