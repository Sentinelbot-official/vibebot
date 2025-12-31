const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const play = require('play-dl');
const musicManager = require('../../utils/musicManager');
const logger = require('../../utils/logger');

module.exports = {
  name: 'play',
  aliases: ['p'],
  description: 'Play music from YouTube, Spotify, or SoundCloud',
  usage: '<song name or URL>',
  category: 'music',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    try {
      // Check if user is in a voice channel
      if (!message.member.voice.channel) {
        return message.reply(
          '❌ You need to be in a voice channel to play music!'
        );
      }

      // Check bot permissions
      const permissions = message.member.voice.channel.permissionsFor(
        message.client.user
      );
      if (!permissions.has(PermissionFlagsBits.Connect)) {
        return message.reply(
          "❌ I don't have permission to join your voice channel!"
        );
      }
      if (!permissions.has(PermissionFlagsBits.Speak)) {
        return message.reply(
          "❌ I don't have permission to speak in your voice channel!"
        );
      }

      // Check if query is provided
      if (!args.length) {
        return message.reply(
          '❌ Please provide a song name or URL!\n\n' +
            '**Usage:** `//play <song name or URL>`\n' +
            '**Examples:**\n' +
            '• `//play never gonna give you up`\n' +
            '• `//play https://www.youtube.com/watch?v=dQw4w9WgXcQ`\n' +
            '• `//play https://open.spotify.com/track/...`'
        );
      }

      const query = args.join(' ');
      const guildId = message.guild.id;
      const queue = musicManager.getQueue(guildId);

      // Easter egg: Check for special commands
      const lowerQuery = query.toLowerCase();
      if (lowerQuery === 'never gonna give you up' || lowerQuery === 'rickroll') {
        return message.reply(
          '😏 **Nice try!** But we all know what that is...\n' +
          '🎵 Playing it anyway because it\'s a classic! 💜'
        );
      }

      // Check if playing from favorites
      if (lowerQuery.startsWith('favorite ') || lowerQuery.startsWith('fav ')) {
        const db = require('../../utils/database');
        const favorites = db.get('music_favorites', message.author.id) || [];
        const favIndex = parseInt(lowerQuery.split(' ')[1]) - 1;

        if (favorites.length === 0) {
          return message.reply(
            '💜 **No favorites yet!**\n' +
            'Add songs to your favorites with `//favorites add` while music is playing!'
          );
        }

        if (isNaN(favIndex) || favIndex < 0 || favIndex >= favorites.length) {
          return message.reply(
            `❌ **Invalid favorite number!**\n` +
            `You have ${favorites.length} favorites. Use \`//favorites list\` to see them.`
          );
        }

        const favorite = favorites[favIndex];
        args = [favorite.url]; // Replace args with favorite URL
        // Continue with normal play logic
      }

      // Send searching message with personality
      const searchMessages = [
        '🔍 Searching the vibes...',
        '🎵 Finding that banger...',
        '✨ Locating your jam...',
        '🔴 Searching live...',
        '💜 Community search initiated...',
      ];
      const searchingMsg = await message.reply(
        searchMessages[Math.floor(Math.random() * searchMessages.length)]
      );

      try {
        let song = null;

        // Check if it's a URL
        if (play.yt_validate(args.join(' ')) === 'video') {
          // YouTube video URL
          const info = await play.video_info(query);
          song = {
            title: info.video_details.title,
            url: info.video_details.url,
            duration: formatDuration(info.video_details.durationInSec),
            thumbnail: info.video_details.thumbnails[0]?.url,
            requester: message.author.tag,
          };
        } else if (play.yt_validate(query) === 'playlist') {
          // YouTube playlist
          const playlist = await play.playlist_info(query, {
            incomplete: true,
          });
          const videos = await playlist.all_videos();

          if (videos.length === 0) {
            return searchingMsg.edit('❌ No videos found in that playlist!');
          }

          // Add all videos to queue
          for (const video of videos.slice(0, 50)) {
            // Limit to 50 songs
            musicManager.addSong(guildId, {
              title: video.title,
              url: video.url,
              duration: formatDuration(video.durationInSec),
              thumbnail: video.thumbnails[0]?.url,
              requester: message.author.tag,
            });
          }

          // Join voice channel if not already in
          if (!queue.voiceChannel) {
            await musicManager.joinChannel(
              message.member.voice.channel,
              message.channel
            );
          }

          // Start playing if not already playing
          if (!queue.playing) {
            await musicManager.play(guildId);
          }

          return searchingMsg.edit({
            embeds: [
              {
                color: 0x9b59b6,
                title: '📋 Playlist Added',
                description: `Added **${videos.length}** songs from **${playlist.title}**`,
                fields: [
                  {
                    name: 'Requested by',
                    value: message.author.tag,
                    inline: true,
                  },
                  {
                    name: 'Queue Length',
                    value: `${queue.songs.length} songs`,
                    inline: true,
                  },
                ],
                thumbnail: { url: playlist.thumbnail?.url || '' },
                footer: { text: 'Vibe Bot Music System' },
                timestamp: new Date(),
              },
            ],
          });
        } else if (play.sp_validate(query)) {
          // Spotify URL
          const spotifyData = await play.spotify(query);

          if (spotifyData.type === 'track') {
            // Single track
            const searchResult = await play.search(
              `${spotifyData.name} ${spotifyData.artists[0].name}`,
              { limit: 1 }
            );

            if (searchResult.length === 0) {
              return searchingMsg.edit(
                '❌ Could not find that song on YouTube!'
              );
            }

            song = {
              title: spotifyData.name,
              url: searchResult[0].url,
              duration: formatDuration(searchResult[0].durationInSec),
              thumbnail: spotifyData.thumbnail?.url,
              requester: message.author.tag,
            };
          } else if (
            spotifyData.type === 'playlist' ||
            spotifyData.type === 'album'
          ) {
            // Playlist or album
            const tracks = await spotifyData.all_tracks();

            if (tracks.length === 0) {
              return searchingMsg.edit('❌ No tracks found in that playlist!');
            }

            // Add all tracks to queue
            let addedCount = 0;
            for (const track of tracks.slice(0, 50)) {
              // Limit to 50 songs
              try {
                const searchResult = await play.search(
                  `${track.name} ${track.artists[0].name}`,
                  { limit: 1 }
                );

                if (searchResult.length > 0) {
                  musicManager.addSong(guildId, {
                    title: track.name,
                    url: searchResult[0].url,
                    duration: formatDuration(searchResult[0].durationInSec),
                    thumbnail: track.thumbnail?.url,
                    requester: message.author.tag,
                  });
                  addedCount++;
                }
              } catch (error) {
                logger.warn(`Failed to add track ${track.name}:`, error);
              }
            }

            // Check if any songs were added
            if (addedCount === 0) {
              return searchingMsg.edit(
                '❌ Could not find any songs from that Spotify playlist on YouTube!'
              );
            }

            // Join voice channel if not already in
            if (!queue.voiceChannel) {
              await musicManager.joinChannel(
                message.member.voice.channel,
                message.channel
              );
            }

            // Start playing if not already playing
            if (!queue.playing) {
              await musicManager.play(guildId);
            }

            return searchingMsg.edit({
              embeds: [
                {
                  color: 0x1db954,
                  title: '🎵 Spotify Playlist Added',
                  description: `Added **${addedCount}** songs from **${spotifyData.name}**`,
                  fields: [
                    {
                      name: 'Requested by',
                      value: message.author.tag,
                      inline: true,
                    },
                    {
                      name: 'Queue Length',
                      value: `${queue.songs.length} songs`,
                      inline: true,
                    },
                  ],
                  thumbnail: { url: spotifyData.thumbnail?.url || '' },
                  footer: { text: 'Vibe Bot Music System' },
                  timestamp: new Date(),
                },
              ],
            });
          }
        } else {
          // Search YouTube
          const searchResults = await play.search(query, { limit: 1 });

          if (searchResults.length === 0) {
            return searchingMsg.edit(
              '❌ No results found! Try a different search term.'
            );
          }

          const video = searchResults[0];
          song = {
            title: video.title,
            url: video.url,
            duration: formatDuration(video.durationInSec),
            thumbnail: video.thumbnails[0]?.url,
            requester: message.author.tag,
          };
        }

        if (!song) {
          return searchingMsg.edit('❌ Failed to process that song!');
        }

        // Add song to queue
        const position = musicManager.addSong(guildId, song);

        // Join voice channel if not already in
        if (!queue.voiceChannel) {
          await musicManager.joinChannel(
            message.member.voice.channel,
            message.channel
          );
        }

        // Start playing if not already playing
        if (!queue.playing) {
          await musicManager.play(guildId);
          return searchingMsg.delete().catch(() => {}); // Delete searching message, now playing will be sent
        } else {
          // Song added to queue
          return searchingMsg.edit({
            embeds: [
              {
                color: 0x9b59b6,
                title: '➕ Added to Queue',
                description: `**[${song.title}](${song.url})**`,
                fields: [
                  {
                    name: 'Duration',
                    value: song.duration,
                    inline: true,
                  },
                  {
                    name: 'Position',
                    value: `#${position}`,
                    inline: true,
                  },
                  {
                    name: 'Requested by',
                    value: song.requester,
                    inline: true,
                  },
                ],
                thumbnail: { url: song.thumbnail || '' },
                footer: { text: 'Vibe Bot Music System' },
                timestamp: new Date(),
              },
            ],
          });
        }
      } catch (error) {
        logger.error('Error in play command:', error);
        return searchingMsg.edit(
          '❌ An error occurred while processing your request!\n\n' +
            '**Possible issues:**\n' +
            '• The video is age-restricted or unavailable\n' +
            '• The URL is invalid\n' +
            '• The service is temporarily unavailable\n\n' +
            'Please try again with a different song or URL.'
        );
      }
    } catch (error) {
      logger.error('Fatal error in play command:', error);
      return message.reply(
        '❌ A critical error occurred! Please try again later.'
      );
    }
  },
};

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Unknown';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
