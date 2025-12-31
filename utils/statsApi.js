/**
 * Stats API - Provides bot statistics for the website
 * Built 24/7 live on Twitch with the community
 */

const http = require('http');
const logger = require('./logger');

class StatsAPI {
  constructor() {
    this.client = null;
    this.server = null;
    this.port = process.env.STATS_API_PORT || 3000;
    this.enabled = process.env.ENABLE_STATS_API === 'true';
  }

  /**
   * Initialize the stats API server
   * @param {Client} client - Discord client instance
   */
  init(client) {
    if (!this.enabled) {
      logger.info(
        'Stats API is disabled. Set ENABLE_STATS_API=true to enable.'
      );
      return;
    }

    this.client = client;

    this.server = http.createServer((req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Only allow GET requests
      if (req.method !== 'GET') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      // Route handling
      if (req.url === '/api/stats') {
        this.handleStatsRequest(res);
      } else if (req.url === '/api/status') {
        this.handleStatusRequest(res);
      } else if (req.url === '/api/health') {
        this.handleHealthRequest(res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(this.port, () => {
      logger.success(`📊 Stats API listening on port ${this.port}`);
      logger.info(`Stats endpoint: http://localhost:${this.port}/api/stats`);
    });

    // Handle server errors
    this.server.on('error', error => {
      logger.error('Stats API error:', error);
    });
  }

  /**
   * Handle /api/stats request
   */
  handleStatsRequest(res) {
    try {
      if (!this.client || !this.client.isReady()) {
        res.writeHead(503);
        res.end(
          JSON.stringify({
            error: 'Bot is not ready',
            online: false,
          })
        );
        return;
      }

      const stats = {
        online: true,
        servers: this.client.guilds.cache.size,
        users: this.client.users.cache.size,
        channels: this.client.channels.cache.size,
        commands: this.client.commands ? this.client.commands.size : 0,
        uptime: process.uptime(),
        uptimeFormatted: this.formatUptime(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        version: require('../package.json').version,
        nodeVersion: process.version,
        ping: this.client.ws.ping,
        timestamp: Date.now(),
      };

      res.writeHead(200);
      res.end(JSON.stringify(stats));
    } catch (error) {
      logger.error('Error handling stats request:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  /**
   * Handle /api/status request (simple bot status check)
   */
  handleStatusRequest(res) {
    try {
      const status = {
        online: this.client && this.client.isReady(),
        timestamp: Date.now(),
      };

      res.writeHead(200);
      res.end(JSON.stringify(status));
    } catch (error) {
      logger.error('Error handling status request:', error);
      res.writeHead(500);
      res.end(
        JSON.stringify({ error: 'Internal server error', online: false })
      );
    }
  }

  /**
   * Handle /api/health request (health check)
   */
  handleHealthRequest(res) {
    try {
      const health = {
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
      };

      res.writeHead(200);
      res.end(JSON.stringify(health));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ status: 'error' }));
    }
  }

  /**
   * Format uptime in a human-readable format
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * Shutdown the stats API server
   */
  shutdown() {
    if (this.server) {
      logger.info('Shutting down Stats API...');
      this.server.close(() => {
        logger.success('Stats API shut down successfully');
      });
    }
  }
}

// Export singleton instance
module.exports = new StatsAPI();
