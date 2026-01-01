const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

module.exports = {
  name: 'lyrics',
  description: 'Get lyrics for the currently playing song or search',
  usage: '[song name]',
  category: 'music',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const musicManager = require('../../utils/musicManager');
    const queue = musicManager.getQueue(message.guild.id);

    let songName;

    if (args.length > 0) {
      songName = args.join(' ');
    } else if (queue && queue.currentSong) {
      songName = queue.currentSong.title;
    } else {
      return message.reply('❌ No song is currently playing! Provide a song name to search.');
    }

    const loadingMsg = await message.reply('🔍 Searching for lyrics...');

    try {
      // Using lyrics.ovh API (free, no key required)
      const cleanSongName = songName.replace(/\(.*?\)/g, '').trim();
      const [artist, title] = cleanSongName.includes('-')
        ? cleanSongName.split('-').map(s => s.trim())
        : ['Unknown', cleanSongName];

      const response = await axios.get(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      );

      if (response.data && response.data.lyrics) {
        const lyrics = response.data.lyrics;
        const chunks = splitLyrics(lyrics);

        for (let i = 0; i < Math.min(chunks.length, 3); i++) {
          const embed = new EmbedBuilder()
            .setColor(branding.colors.primary)
            .setTitle(i === 0 ? `🎵 ${songName}` : null)
            .setDescription(chunks[i])
            .setFooter(
              i === chunks.length - 1
                ? branding.footers.default
                : { text: `Page ${i + 1}/${Math.min(chunks.length, 3)}` }
            )
            .setTimestamp();

          if (i === 0) {
            await loadingMsg.edit({ content: null, embeds: [embed] });
          } else {
            await message.channel.send({ embeds: [embed] });
          }
        }

        if (chunks.length > 3) {
          await message.channel.send('_Lyrics truncated. Full lyrics too long for Discord._');
        }
      } else {
        throw new Error('No lyrics found');
      }
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('❌ Lyrics Not Found')
        .setDescription(
          `Couldn't find lyrics for **${songName}**\n\n` +
            '**Try:**\n' +
            '• Searching with artist name: `//lyrics Artist - Song`\n' +
            '• Checking the song name spelling\n' +
            '• Some songs may not have lyrics available'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    }
  },
};

function splitLyrics(lyrics) {
  const maxLength = 4000;
  const chunks = [];
  let currentChunk = '';

  const lines = lyrics.split('\n');

  for (const line of lines) {
    if ((currentChunk + line + '\n').length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
