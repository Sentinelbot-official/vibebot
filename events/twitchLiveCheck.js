const { EmbedBuilder } = require('discord.js');
const twitchApi = require('../utils/twitchApi');
const db = require('../utils/database');
const logger = require('../utils/logger');
const branding = require('../utils/branding');

// Track which streams are currently live to avoid duplicate notifications
const liveStreams = new Map();

module.exports = {
  name: 'twitchLiveCheck',
  once: false,

  async execute(client) {
    // Check if Twitch API is configured
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
      logger.warn(
        '[TWITCH] Twitch API credentials not configured. Live alerts disabled.'
      );
      return;
    }

    // Validate credentials on first run
    const isValid = await twitchApi.validateCredentials();
    if (!isValid) {
      logger.error('[TWITCH] Invalid Twitch API credentials!');
      return;
    }

    logger.info('[TWITCH] Live alert system initialized');

    // Check every 2 minutes
    setInterval(
      async () => {
        await checkAllStreams(client);
      },
      2 * 60 * 1000
    );

    // Initial check
    await checkAllStreams(client);
  },
};

async function checkAllStreams(client) {
  try {
    // Get all guilds with Twitch notifications enabled
    const allSettings = db.all('guild_settings');

    for (const { key: guildId, value: settings } of allSettings) {
      if (!settings.twitchNotifications?.enabled) continue;

      const { channelId, streamers } = settings.twitchNotifications;

      if (!channelId || !streamers || streamers.length === 0) continue;

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) continue;

      // Check each streamer
      for (const streamer of streamers) {
        await checkStreamer(channel, guildId, streamer);
      }
    }
  } catch (error) {
    logger.error('[TWITCH] Error checking streams:', error);
  }
}

async function checkStreamer(channel, guildId, streamerUsername) {
  try {
    const streamInfo = await twitchApi.getStreamInfo(streamerUsername);
    const streamKey = `${guildId}-${streamerUsername}`;

    if (streamInfo && streamInfo.isLive) {
      // Stream is live
      if (!liveStreams.has(streamKey)) {
        // New stream started - send notification
        liveStreams.set(streamKey, {
          startedAt: streamInfo.startedAt,
          notifiedAt: Date.now(),
        });

        await sendLiveNotification(channel, streamInfo, guildId);
      }
    } else {
      // Stream is offline
      if (liveStreams.has(streamKey)) {
        // Stream ended
        liveStreams.delete(streamKey);
        logger.info(`[TWITCH] ${streamerUsername} went offline`);
      }
    }
  } catch (error) {
    logger.error(`[TWITCH] Error checking ${streamerUsername}:`, error.message);
  }
}

async function sendLiveNotification(channel, streamInfo, guildId) {
  try {
    const settings = db.get('guild_settings', guildId);
    const customMessage =
      settings?.twitchNotifications?.customMessage ||
      '🔴 **{streamer}** is now LIVE!';

    const message = customMessage
      .replace('{streamer}', streamInfo.username)
      .replace('{game}', streamInfo.game)
      .replace('{title}', streamInfo.title)
      .replace('{url}', streamInfo.url);

    const embed = new EmbedBuilder()
      .setColor('#9146FF') // Twitch purple
      .setAuthor({
        name: `${streamInfo.username} is now LIVE on Twitch!`,
        iconURL: streamInfo.profileImage,
        url: streamInfo.url,
      })
      .setTitle(streamInfo.title || 'Untitled Stream')
      .setURL(streamInfo.url)
      .setDescription(
        `**Playing:** ${streamInfo.game || 'No Category'}\n` +
          `**Viewers:** ${branding.formatNumber(streamInfo.viewers)}\n\n` +
          `[Watch Stream](${streamInfo.url})`
      )
      .setImage(streamInfo.thumbnailUrl + `?t=${Date.now()}`) // Cache bust
      .setFooter({
        text: `${branding.getFooterText('Started')} • Vibe Bot Live Alerts`,
        iconURL: branding.getTwitchIconURL(),
      })
      .setTimestamp(streamInfo.startedAt);

    // Mention role if configured
    const mentionRole = settings?.twitchNotifications?.mentionRole;
    let content = message;

    if (mentionRole) {
      content = `<@&${mentionRole}> ${message}`;
    }

    await channel.send({
      content,
      embeds: [embed],
    });

    logger.info(
      `[TWITCH] Sent live notification for ${streamInfo.username} in guild ${guildId}`
    );

    // Award viewers with economy bonus if enabled
    if (settings?.twitchNotifications?.rewardViewers) {
      await rewardViewers(channel.guild, streamInfo.username);
    }
  } catch (error) {
    logger.error('[TWITCH] Failed to send live notification:', error);
  }
}

async function rewardViewers(guild, streamerUsername) {
  try {
    // Get all members in voice channels (assuming they're watching)
    const voiceMembers = guild.channels.cache
      .filter(c => c.type === 2) // Voice channels
      .flatMap(c => Array.from(c.members.values()))
      .filter(m => !m.user.bot);

    const rewardAmount = 100; // Coins per live alert

    for (const member of voiceMembers) {
      const economy = db.get('economy', member.id) || {
        coins: 0,
        bank: 0,
      };
      economy.coins += rewardAmount;
      db.set('economy', member.id, economy);
    }

    if (voiceMembers.length > 0) {
      logger.info(
        `[TWITCH] Rewarded ${voiceMembers.length} viewers with ${rewardAmount} coins`
      );
    }
  } catch (error) {
    logger.error('[TWITCH] Failed to reward viewers:', error);
  }
}
