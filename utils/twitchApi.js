const axios = require('axios');
const logger = require('./logger');

class TwitchAPI {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth access token for Twitch API
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in seconds, store expiry time with 5 min buffer
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      logger.info('[TWITCH] OAuth token obtained successfully');
      return this.accessToken;
    } catch (error) {
      logger.error('[TWITCH] Failed to get OAuth token:', error.message);
      throw error;
    }
  }

  /**
   * Get user information by username
   */
  async getUserByUsername(username) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get('https://api.twitch.tv/helix/users', {
        params: { login: username },
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.data.length === 0) {
        return null;
      }

      return response.data.data[0];
    } catch (error) {
      logger.error(`[TWITCH] Failed to get user ${username}:`, error.message);
      return null;
    }
  }

  /**
   * Check if a user is currently live
   */
  async isStreamLive(username) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get('https://api.twitch.tv/helix/streams', {
        params: { user_login: username },
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.length > 0 ? response.data.data[0] : null;
    } catch (error) {
      logger.error(
        `[TWITCH] Failed to check stream status for ${username}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get stream information (title, game, viewer count, etc.)
   */
  async getStreamInfo(username) {
    try {
      const streamData = await this.isStreamLive(username);
      if (!streamData) {
        return null;
      }

      const userData = await this.getUserByUsername(username);

      return {
        isLive: true,
        title: streamData.title,
        game: streamData.game_name,
        viewers: streamData.viewer_count,
        thumbnailUrl: streamData.thumbnail_url
          .replace('{width}', '1920')
          .replace('{height}', '1080'),
        startedAt: new Date(streamData.started_at),
        username: streamData.user_name,
        profileImage: userData?.profile_image_url,
        url: `https://twitch.tv/${username}`,
      };
    } catch (error) {
      logger.error(
        `[TWITCH] Failed to get stream info for ${username}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get recent clips for a user
   */
  async getClips(username, limit = 10) {
    try {
      const token = await this.getAccessToken();
      const user = await this.getUserByUsername(username);

      if (!user) {
        return [];
      }

      const response = await axios.get('https://api.twitch.tv/helix/clips', {
        params: {
          broadcaster_id: user.id,
          first: limit,
        },
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.map(clip => ({
        id: clip.id,
        url: clip.url,
        embedUrl: clip.embed_url,
        title: clip.title,
        views: clip.view_count,
        createdAt: new Date(clip.created_at),
        thumbnailUrl: clip.thumbnail_url,
        duration: clip.duration,
        creator: clip.creator_name,
      }));
    } catch (error) {
      logger.error(
        `[TWITCH] Failed to get clips for ${username}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Get channel's schedule
   */
  async getSchedule(username) {
    try {
      const token = await this.getAccessToken();
      const user = await this.getUserByUsername(username);

      if (!user) {
        return null;
      }

      const response = await axios.get('https://api.twitch.tv/helix/schedule', {
        params: {
          broadcaster_id: user.id,
        },
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.data || !response.data.data.segments) {
        return null;
      }

      return {
        segments: response.data.data.segments.map(segment => ({
          id: segment.id,
          title: segment.title,
          category: segment.category?.name || 'No Category',
          startTime: new Date(segment.start_time),
          endTime: new Date(segment.end_time),
          isRecurring: segment.is_recurring,
        })),
        vacation: response.data.data.vacation,
      };
    } catch (error) {
      logger.error(
        `[TWITCH] Failed to get schedule for ${username}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Search for channels
   */
  async searchChannels(query, limit = 10) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        'https://api.twitch.tv/helix/search/channels',
        {
          params: {
            query: query,
            first: limit,
          },
          headers: {
            'Client-ID': this.clientId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data.map(channel => ({
        id: channel.id,
        username: channel.broadcaster_login,
        displayName: channel.display_name,
        title: channel.title,
        game: channel.game_name,
        isLive: channel.is_live,
        thumbnailUrl: channel.thumbnail_url,
      }));
    } catch (error) {
      logger.error('[TWITCH] Failed to search channels:', error.message);
      return [];
    }
  }

  /**
   * Get top games
   */
  async getTopGames(limit = 10) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        'https://api.twitch.tv/helix/games/top',
        {
          params: { first: limit },
          headers: {
            'Client-ID': this.clientId,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data.map(game => ({
        id: game.id,
        name: game.name,
        boxArtUrl: game.box_art_url
          .replace('{width}', '285')
          .replace('{height}', '380'),
      }));
    } catch (error) {
      logger.error('[TWITCH] Failed to get top games:', error.message);
      return [];
    }
  }

  /**
   * Validate API credentials
   */
  async validateCredentials() {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new TwitchAPI();
