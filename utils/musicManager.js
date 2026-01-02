/**
 * Music Manager for Vibe Bot
 * Handles music queue, playback, and voice connections
 * Built with @discordjs/voice and play-dl for maximum reliability
 */

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');
const play = require('play-dl');
const logger = require('./logger');

class MusicManager {
  constructor() {
    this.queues = new Map(); // guildId => queue object
    this.players = new Map(); // guildId => audio player
    this.connections = new Map(); // guildId => voice connection
    this.disconnectTimers = new Map(); // guildId => timeout ID
  }

  /**
   * Get or create a queue for a guild
   * @param {string} guildId - Guild ID
   * @returns {Object} Queue object
   */
  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        songs: [],
        volume: 50,
        playing: false,
        loop: false,
        loopQueue: false,
        textChannel: null,
        voiceChannel: null,
      });
    }
    return this.queues.get(guildId);
  }

  /**
   * Validate if a URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url === 'undefined' || url === 'null') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean invalid songs from queue
   * @param {string} guildId - Guild ID
   * @returns {number} Number of songs removed
   */
  cleanQueue(guildId) {
    const queue = this.getQueue(guildId);
    const originalLength = queue.songs.length;
    queue.songs = queue.songs.filter(song => this.isValidUrl(song?.url));
    const removed = originalLength - queue.songs.length;
    if (removed > 0) {
      logger.warn(`Removed ${removed} invalid song(s) from queue in guild ${guildId}`);
    }
    return removed;
  }

  /**
   * Add a song to the queue
   * @param {string} guildId - Guild ID
   * @param {Object} song - Song object
   * @returns {number} Position in queue
   */
  addSong(guildId, song) {
    // Validate song has required properties
    if (!song || !this.isValidUrl(song.url)) {
      logger.warn(`Invalid song object added to queue for guild ${guildId}:`, song);
      throw new Error('Song must have a valid URL');
    }
    
    const queue = this.getQueue(guildId);
    queue.songs.push(song);
    return queue.songs.length;
  }

  /**
   * Join a voice channel
   * @param {Object} voiceChannel - Voice channel to join
   * @param {Object} textChannel - Text channel for messages
   * @returns {Promise<Object>} Voice connection
   */
  async joinChannel(voiceChannel, textChannel) {
    const guildId = voiceChannel.guild.id;

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true, // Bot should be deafened
      });

      // Wait for connection to be ready
      await entersState(connection, VoiceConnectionStatus.Ready, 30000);

      // Store connection
      this.connections.set(guildId, connection);

      // Update queue
      const queue = this.getQueue(guildId);
      queue.voiceChannel = voiceChannel;
      queue.textChannel = textChannel;

      // Handle connection state changes
      connection.on('stateChange', async (oldState, newState) => {
        if (newState.status === VoiceConnectionStatus.Disconnected) {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
            // Seems to be reconnecting
          } catch (error) {
            // Disconnect is permanent
            connection.destroy();
            this.cleanup(guildId);
            logger.warn(`Voice connection lost for guild ${guildId}`);
          }
        }
      });

      logger.info(`Joined voice channel in guild ${guildId}`);
      return connection;
    } catch (error) {
      logger.error(`Failed to join voice channel in guild ${guildId}:`, error);
      throw new Error(
        'Could not join voice channel. Please check bot permissions.'
      );
    }
  }

  /**
   * Create or get audio player for a guild
   * @param {string} guildId - Guild ID
   * @returns {Object} Audio player
   */
  getPlayer(guildId) {
    if (!this.players.has(guildId)) {
      const player = createAudioPlayer();

      // Handle player state changes
      player.on(AudioPlayerStatus.Idle, () => {
        this.handleSongEnd(guildId);
      });

      player.on('error', error => {
        logger.error(`Audio player error in guild ${guildId}:`, error);
        this.handleSongEnd(guildId);
      });

      this.players.set(guildId, player);
    }
    return this.players.get(guildId);
  }

  /**
   * Play the next song in queue
   * @param {string} guildId - Guild ID
   * @returns {Promise<boolean>} Success status
   */
  async play(guildId) {
    const queue = this.getQueue(guildId);
    const player = this.getPlayer(guildId);
    const connection = this.connections.get(guildId);

    if (!connection) {
      logger.warn(`No voice connection for guild ${guildId}`);
      return false;
    }

    // Clean queue of invalid songs first - do this aggressively
    const removedCount = this.cleanQueue(guildId);
    if (removedCount > 0) {
      logger.warn(`Removed ${removedCount} invalid song(s) from queue in guild ${guildId}`);
    }

    if (queue.songs.length === 0) {
      queue.playing = false;
      logger.info(`Queue is empty for guild ${guildId}`);
      return false;
    }

    // Get the first song and validate it exists
    const song = queue.songs[0];
    
    // Aggressive validation - check song object structure
    if (!song) {
      logger.error(`Song object is null/undefined in queue for guild ${guildId}`);
      queue.songs.shift();
      if (queue.songs.length > 0) {
        return this.play(guildId);
      } else {
        queue.playing = false;
        return false;
      }
    }

    // Check if song has url property at all
    if (!('url' in song)) {
      logger.error(`Song object missing 'url' property in guild ${guildId}:`, JSON.stringify(song));
      queue.songs.shift();
      if (queue.songs.length > 0) {
        return this.play(guildId);
      } else {
        queue.playing = false;
        return false;
      }
    }
    
    // Log queue state for debugging
    logger.info(`Playing song from queue in guild ${guildId}. Queue length: ${queue.songs.length}`);
    logger.info(`Song object:`, JSON.stringify(song, null, 2));
    logger.info(`Song URL value:`, song.url, `Type:`, typeof song.url);
    
    // Double-check song URL before playing
    if (!this.isValidUrl(song.url)) {
      logger.warn(`Invalid song URL in queue for guild ${guildId}:`, JSON.stringify(song));
      queue.songs.shift();
      if (queue.songs.length > 0) {
        return this.play(guildId);
      } else {
        queue.playing = false;
        return false;
      }
    }
    
    queue.playing = true;

    // Clear any disconnect timer since we're playing again
    if (this.disconnectTimers.has(guildId)) {
      clearTimeout(this.disconnectTimers.get(guildId));
      this.disconnectTimers.delete(guildId);
    }

    try {
      // Final validation before streaming - check multiple times
      if (!song || !song.url) {
        logger.error(`Song object is invalid before streaming in guild ${guildId}:`, JSON.stringify(song));
        throw new Error(`Song object is invalid: ${JSON.stringify(song)}`);
      }

      if (!this.isValidUrl(song.url)) {
        logger.error(`Invalid song URL before streaming in guild ${guildId}:`, song.url, 'Song:', JSON.stringify(song));
        throw new Error(`Invalid song URL: ${song.url}`);
      }

      // Double-check URL is still valid right before streaming
      const urlToStream = song.url;
      if (!urlToStream || typeof urlToStream !== 'string' || urlToStream === 'undefined' || urlToStream === 'null') {
        logger.error(`URL became invalid right before streaming in guild ${guildId}:`, urlToStream);
        throw new Error(`URL is invalid: ${urlToStream}`);
      }

      // Final safety check - if URL is still invalid, throw before play-dl
      if (!urlToStream || urlToStream === 'undefined' || urlToStream === 'null' || typeof urlToStream !== 'string') {
        logger.error(`CRITICAL: URL is invalid right before play.stream() in guild ${guildId}:`, {
          urlToStream,
          type: typeof urlToStream,
          song: JSON.stringify(song)
        });
        throw new Error(`Cannot stream: URL is ${urlToStream}`);
      }

      // Try to create URL object to validate format
      try {
        new URL(urlToStream);
      } catch (urlError) {
        logger.error(`CRITICAL: URL format is invalid in guild ${guildId}:`, {
          urlToStream,
          error: urlError.message,
          song: JSON.stringify(song)
        });
        throw new Error(`Invalid URL format: ${urlToStream}`);
      }

      logger.info(`Attempting to stream URL for guild ${guildId}:`, urlToStream.substring(0, 50) + '...');

      // Get stream from play-dl
      // Based on play-dl documentation, stream_from_info() is more reliable than stream()
      // It requires an InfoData object from video_info()
      let stream;
      try {
        // Get video info first - this returns InfoData object with video_details, format, etc.
        logger.info(`Fetching video_info for guild ${guildId}...`);
        const videoInfo = await play.video_info(urlToStream);
        
        // Validate the InfoData structure
        if (!videoInfo) {
          throw new Error('video_info returned null/undefined');
        }
        
        logger.info(`video_info structure check for guild ${guildId}:`, {
          hasVideoDetails: !!videoInfo.video_details,
          hasFormat: !!videoInfo.format,
          hasHtml5Player: !!videoInfo.html5player,
          videoDetailsUrl: videoInfo.video_details?.url,
          videoDetailsTitle: videoInfo.video_details?.title
        });
        
        if (!videoInfo.video_details) {
          throw new Error('video_info missing video_details property');
        }
        
        if (!videoInfo.video_details.url) {
          throw new Error('video_details missing url property');
        }

        // Validate InfoData structure before using stream_from_info
        if (!videoInfo.format || !Array.isArray(videoInfo.format) || videoInfo.format.length === 0) {
          logger.warn(`video_info missing format array, trying alternative method for guild ${guildId}`);
          // If format is missing, try using video_details.url directly
          if (videoInfo.video_details && videoInfo.video_details.url) {
            stream = await play.stream(videoInfo.video_details.url);
            logger.info(`Successfully streamed using video_details.url for guild ${guildId}`);
          } else {
            throw new Error('video_info missing required format or video_details.url');
          }
        } else {
          // Check if format array has valid entries with URLs
          const validFormats = videoInfo.format.filter(f => f && f.url);
          logger.info(`Got video_info with format array (${videoInfo.format.length} formats, ${validFormats.length} with URLs), using stream_from_info for guild ${guildId}`);
          
          if (validFormats.length === 0) {
            logger.warn(`Format array has no valid URLs, trying video_details.url for guild ${guildId}`);
            stream = await play.stream(videoInfo.video_details.url);
            logger.info(`Successfully streamed using video_details.url fallback for guild ${guildId}`);
          } else {
            // Use stream_from_info with the InfoData object - this is the recommended method
            try {
              stream = await play.stream_from_info(videoInfo);
              logger.info(`Successfully streamed using stream_from_info for guild ${guildId}`);
            } catch (streamFromInfoError) {
              // If stream_from_info fails even with valid InfoData, try using the URL from video_details
              logger.warn(`stream_from_info failed despite valid InfoData, trying video_details.url:`, streamFromInfoError.message);
              stream = await play.stream(videoInfo.video_details.url);
              logger.info(`Successfully streamed using video_details.url after stream_from_info failure for guild ${guildId}`);
            }
          }
        }
      } catch (infoError) {
        // If video_info fails, try direct stream as fallback
        logger.warn(`video_info method failed, trying direct stream for guild ${guildId}:`, infoError.message);
        try {
          stream = await play.stream(urlToStream);
          logger.info(`Successfully streamed using direct stream method for guild ${guildId}`);
        } catch (streamError) {
          logger.error(`Both streaming methods failed in guild ${guildId}:`, {
            urlToStream,
            infoError: infoError.message,
            streamError: streamError.message,
            song: JSON.stringify(song)
          });
          throw new Error(`play-dl failed: video_info error: ${infoError.message}, stream error: ${streamError.message}`);
        }
      }

      // Create audio resource
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });

      // Set volume
      if (resource.volume) {
        resource.volume.setVolume(queue.volume / 100);
      }

      // Subscribe connection to player
      connection.subscribe(player);

      // Play the resource
      player.play(resource);

      logger.info(`Now playing: ${song.title} in guild ${guildId}`);

      // Track music stats for the requester
      this.trackSongPlay(song, queue.voiceChannel);

      // Send now playing message
      if (queue.textChannel) {
        try {
          // Fun random messages for personality
          const vibeMessages = [
            "Let's vibe to this! 🎵",
            "This one's a banger! 🔥",
            'Turning up the vibes! ✨',
            'Community choice incoming! 💜',
            'Time to vibe! 🎶',
            'Built live, played live! 🔴',
            'Stream-approved vibes! 🎬',
          ];
          const randomVibe =
            vibeMessages[Math.floor(Math.random() * vibeMessages.length)];

          await queue.textChannel.send({
            embeds: [
              {
                color: 0x9b59b6,
                author: {
                  name: randomVibe,
                  icon_url: 'https://cdn.discordapp.com/emojis/123456789.png', // Optional: Add your bot's icon
                },
                title: '🎵 Now Playing',
                description: `**[${song.title}](${song.url})**\n\n*Built 24/7 live on stream with the community!*`,
                fields: [
                  {
                    name: '⏱️ Duration',
                    value: song.duration || 'Live Stream',
                    inline: true,
                  },
                  {
                    name: '👤 Requested by',
                    value: song.requester,
                    inline: true,
                  },
                  {
                    name: '📋 Queue',
                    value: `${queue.songs.length} song${queue.songs.length !== 1 ? 's' : ''}`,
                    inline: true,
                  },
                  {
                    name: '🔊 Volume',
                    value: `${queue.volume}%`,
                    inline: true,
                  },
                  {
                    name: '🔁 Loop',
                    value: queue.loop
                      ? '✅ Song'
                      : queue.loopQueue
                        ? '✅ Queue'
                        : '❌ Off',
                    inline: true,
                  },
                  {
                    name: '🎚️ Controls',
                    value: '`//pause` `//skip` `//queue` `//volume`',
                    inline: true,
                  },
                ],
                thumbnail: { url: song.thumbnail || '' },
                footer: {
                  text: '🔴 Music coded live on Twitch • twitch.tv/projectdraguk',
                  icon_url:
                    'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-70x70.png',
                },
                timestamp: new Date(),
              },
            ],
          });
        } catch (error) {
          logger.error('Failed to send now playing message:', error);
        }
      }

      return true;
    } catch (error) {
      logger.error(`Failed to play song in guild ${guildId}:`, error);

      // Remove the invalid song from queue
      queue.songs.shift();

      // Send error message
      if (queue.textChannel) {
        try {
          const errorMsg = error.message?.includes('Invalid URL') || !song.url
            ? `❌ **${song.title || 'Unknown song'}** has an invalid URL. Removed from queue.`
            : `❌ Failed to play **${song.title || 'Unknown song'}**. Skipping to next song...`;
          
          await queue.textChannel.send(errorMsg);
        } catch {}
      }

      // If there are more songs, try playing the next one
      if (queue.songs.length > 0) {
        return this.play(guildId);
      } else {
        // No more songs, stop playing
        this.handleSongEnd(guildId);
        return false;
      }
    }
  }

  /**
   * Handle song end (play next or cleanup)
   * @param {string} guildId - Guild ID
   */
  async handleSongEnd(guildId) {
    const queue = this.getQueue(guildId);

    if (queue.loop && queue.songs.length > 0) {
      // Loop current song - don't remove it
      await this.play(guildId);
    } else if (queue.loopQueue && queue.songs.length > 0) {
      // Loop queue - move first song to end
      const song = queue.songs.shift();
      queue.songs.push(song);
      await this.play(guildId);
    } else {
      // Normal playback - remove finished song
      queue.songs.shift();

      if (queue.songs.length > 0) {
        await this.play(guildId);
      } else {
        // Queue is empty
        queue.playing = false;

        if (queue.textChannel) {
          try {
            const endMessages = [
              '✅ Queue finished! **Keep the vibes going** with `//play` 🎵',
              '🎵 That was fire! **Add more songs** with `//play` 🔥',
              '✨ Great session! **Queue up more vibes** with `//play` 💜',
              '🎶 Music paused! **Keep vibing** - use `//play` to continue!',
              '💜 Thanks for vibing with us! **More music?** Try `//play`',
            ];
            const randomEnd =
              endMessages[Math.floor(Math.random() * endMessages.length)];
            await queue.textChannel.send(randomEnd);
          } catch {}
        }

        // Clear any existing disconnect timer
        if (this.disconnectTimers.has(guildId)) {
          clearTimeout(this.disconnectTimers.get(guildId));
        }

        // Disconnect after 5 minutes of inactivity
        const timer = setTimeout(
          () => {
            const currentQueue = this.queues.get(guildId);
            if (currentQueue && !currentQueue.playing) {
              this.leave(guildId);
            }
          },
          5 * 60 * 1000
        );

        this.disconnectTimers.set(guildId, timer);
      }
    }
  }

  /**
   * Pause playback
   * @param {string} guildId - Guild ID
   * @returns {boolean} Success status
   */
  pause(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      return player.pause();
    }
    return false;
  }

  /**
   * Resume playback
   * @param {string} guildId - Guild ID
   * @returns {boolean} Success status
   */
  resume(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      return player.unpause();
    }
    return false;
  }

  /**
   * Skip current song
   * @param {string} guildId - Guild ID
   * @returns {boolean} Success status
   */
  skip(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      player.stop(); // This will trigger handleSongEnd
      return true;
    }
    return false;
  }

  /**
   * Stop playback and clear queue
   * @param {string} guildId - Guild ID
   */
  stop(guildId) {
    const queue = this.getQueue(guildId);
    const player = this.players.get(guildId);

    queue.songs = [];
    queue.playing = false;

    if (player) {
      player.stop();
    }
  }

  /**
   * Leave voice channel
   * @param {string} guildId - Guild ID
   */
  leave(guildId) {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
    }
    this.cleanup(guildId);
  }

  /**
   * Clean up guild data
   * @param {string} guildId - Guild ID
   */
  cleanup(guildId) {
    // Clear disconnect timer if exists
    if (this.disconnectTimers.has(guildId)) {
      clearTimeout(this.disconnectTimers.get(guildId));
      this.disconnectTimers.delete(guildId);
    }

    this.queues.delete(guildId);
    this.players.delete(guildId);
    this.connections.delete(guildId);
    logger.info(`Cleaned up music data for guild ${guildId}`);
  }

  /**
   * Set volume
   * @param {string} guildId - Guild ID
   * @param {number} volume - Volume (0-100)
   * @returns {boolean} Success status
   */
  setVolume(guildId, volume) {
    const queue = this.getQueue(guildId);
    const player = this.players.get(guildId);

    if (volume < 0 || volume > 100) {
      return false;
    }

    queue.volume = volume;

    // Update current playing song volume
    if (player && player.state.status === AudioPlayerStatus.Playing) {
      const resource = player.state.resource;
      if (resource && resource.volume) {
        resource.volume.setVolume(volume / 100);
      }
    }

    return true;
  }

  /**
   * Toggle loop mode
   * @param {string} guildId - Guild ID
   * @returns {boolean} New loop state
   */
  toggleLoop(guildId) {
    const queue = this.getQueue(guildId);
    queue.loop = !queue.loop;
    if (queue.loop) {
      queue.loopQueue = false; // Disable queue loop if enabling song loop
    }
    return queue.loop;
  }

  /**
   * Toggle queue loop mode
   * @param {string} guildId - Guild ID
   * @returns {boolean} New loop queue state
   */
  toggleLoopQueue(guildId) {
    const queue = this.getQueue(guildId);
    queue.loopQueue = !queue.loopQueue;
    if (queue.loopQueue) {
      queue.loop = false; // Disable song loop if enabling queue loop
    }
    return queue.loopQueue;
  }

  /**
   * Track song play for statistics
   * @param {Object} song - Song object
   * @param {Object} voiceChannel - Voice channel
   */
  trackSongPlay(song, voiceChannel) {
    try {
      const db = require('./database');

      // Get all listeners (excluding bots)
      const listeners = voiceChannel.members.filter(m => !m.user.bot);

      listeners.forEach(member => {
        const userId = member.id;
        let stats = db.get('music_stats', userId) || {
          totalSongsPlayed: 0,
          totalListeningTime: 0,
          topSongs: {},
          recentlyPlayed: [],
          firstSongPlayed: null,
        };

        // Update stats
        stats.totalSongsPlayed++;

        // Parse duration and add to total time
        if (song.duration) {
          const parts = song.duration.split(':');
          let seconds = 0;
          if (parts.length === 2) {
            seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          } else if (parts.length === 3) {
            seconds =
              parseInt(parts[0]) * 3600 +
              parseInt(parts[1]) * 60 +
              parseInt(parts[2]);
          }
          stats.totalListeningTime += seconds;
        }

        // Track top songs
        if (!stats.topSongs[song.title]) {
          stats.topSongs[song.title] = {
            plays: 0,
            url: song.url,
          };
        }
        stats.topSongs[song.title].plays++;

        // Add to recently played (keep last 10)
        stats.recentlyPlayed = stats.recentlyPlayed || [];
        stats.recentlyPlayed.unshift({
          title: song.title,
          url: song.url,
          playedAt: Date.now(),
        });
        stats.recentlyPlayed = stats.recentlyPlayed.slice(0, 10);

        // Set first song played if not set
        if (!stats.firstSongPlayed) {
          stats.firstSongPlayed = Date.now();
        }

        db.set('music_stats', userId, stats);
      });
    } catch (error) {
      logger.error('Failed to track song play:', error);
    }
  }
}

// Export singleton instance
module.exports = new MusicManager();
