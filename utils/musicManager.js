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
   * Add a song to the queue
   * @param {string} guildId - Guild ID
   * @param {Object} song - Song object
   * @returns {number} Position in queue
   */
  addSong(guildId, song) {
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
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
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

    if (queue.songs.length === 0) {
      queue.playing = false;
      return false;
    }

    const song = queue.songs[0];
    queue.playing = true;

    try {
      // Get stream from play-dl
      const stream = await play.stream(song.url);

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

      // Send now playing message
      if (queue.textChannel) {
        try {
          await queue.textChannel.send({
            embeds: [
              {
                color: 0x9b59b6,
                title: '🎵 Now Playing',
                description: `**[${song.title}](${song.url})**`,
                fields: [
                  {
                    name: 'Duration',
                    value: song.duration || 'Unknown',
                    inline: true,
                  },
                  {
                    name: 'Requested by',
                    value: song.requester,
                    inline: true,
                  },
                  {
                    name: 'Position',
                    value: `1 of ${queue.songs.length}`,
                    inline: true,
                  },
                ],
                thumbnail: { url: song.thumbnail || '' },
                footer: { text: 'Vibe Bot Music System' },
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

      // Send error message
      if (queue.textChannel) {
        try {
          await queue.textChannel.send(
            `❌ Failed to play **${song.title}**. Skipping to next song...`
          );
        } catch {}
      }

      // Skip to next song
      this.handleSongEnd(guildId);
      return false;
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
            await queue.textChannel.send(
              '✅ Queue finished! Use `//play` to add more songs.'
            );
          } catch {}
        }

        // Disconnect after 5 minutes of inactivity
        setTimeout(() => {
          const currentQueue = this.queues.get(guildId);
          if (currentQueue && !currentQueue.playing) {
            this.leave(guildId);
          }
        }, 5 * 60 * 1000);
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
}

// Export singleton instance
module.exports = new MusicManager();
