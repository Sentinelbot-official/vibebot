const { EmbedBuilder } = require('discord.js');
const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'current', 'playing'],
  description: 'Show the currently playing song',
  category: 'music',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const queue = musicManager.getQueue(message.guild.id);

    if (!queue.voiceChannel || queue.songs.length === 0) {
      return message.reply('❌ Nothing is playing right now!');
    }

    const song = queue.songs[0];

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎵 Now Playing')
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        {
          name: 'Duration',
          value: song.duration,
          inline: true,
        },
        {
          name: 'Requested by',
          value: song.requester,
          inline: true,
        },
        {
          name: 'Volume',
          value: `${queue.volume}%`,
          inline: true,
        },
        {
          name: 'Queue Position',
          value: `1 of ${queue.songs.length}`,
          inline: true,
        },
        {
          name: 'Loop',
          value: queue.loop ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        },
        {
          name: 'Loop Queue',
          value: queue.loopQueue ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        }
      )
      .setThumbnail(song.thumbnail || '')
      .setFooter({ text: 'Vibe Bot Music System' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
