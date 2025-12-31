const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'live',
  aliases: ['stream', 'twitch', 'islive'],
  description: 'Check if the bot creator is live on Twitch',
  usage: '',
  category: 'general',
  cooldown: 30,
  async execute(message, args) {
    const twitchUsername = 'projectdraguk'; // Your Twitch username

    try {
      // Use Twitch's public API endpoint (no auth required)
      const response = await axios.get(
        `https://decapi.me/twitch/uptime/${twitchUsername}`,
        { timeout: 5000 }
      );

      const uptime = response.data.trim();

      // Check if stream is live
      if (uptime && !uptime.includes('offline') && !uptime.includes('error')) {
        // Stream is LIVE!
        const embed = new EmbedBuilder()
          .setColor(branding.colors.error)
          .setTitle('🔴 LIVE NOW on Twitch!')
          .setURL(`https://twitch.tv/${twitchUsername}`)
          .setDescription(
            `**Airis** is currently live streaming!\n\n` +
              `🎵 Building Vibe Bot with the 24/7 community!`
          )
          .setThumbnail(
            `https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchUsername}-440x248.jpg?t=${Date.now()}`
          )
          .addFields(
            {
              name: '⏱️ Uptime',
              value: uptime,
              inline: true,
            },
            {
              name: '🔴 Watch Now',
              value: `[Click here to watch!](https://twitch.tv/${twitchUsername})`,
              inline: false,
            },
            {
              name: '💜 About',
              value:
                'This bot is being built LIVE 24/7 with viewers worldwide!',
              inline: false,
            }
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } else {
        // Stream is offline
        const embed = new EmbedBuilder()
          .setColor(branding.colors.warning)
          .setTitle('📴 Currently Offline')
          .setDescription(
            `**Airis** is not currently streaming right now.\n\n` +
              `🔴 **Twitch:** https://twitch.tv/${twitchUsername}\n\n` +
              `This bot was built live on stream with viewers from around the world!\n` +
              `We stream 24/7, so check back anytime! 🌍`
          )
          .setThumbnail(
            `https://static-cdn.jtvnw.net/jtv_user_pictures/${twitchUsername}-profile_image-300x300.png`
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      const logger = require('../../utils/logger');
      const branding = require('../../utils/branding');
      logger.error('Error checking Twitch stream:', error);

      // Fallback response
      const embed = new EmbedBuilder()
        .setColor(0x9146ff)
        .setTitle('🔴 24/7 Live Stream')
        .setDescription(
          `**Airis streams 24/7 on Twitch!**\n\n` +
            `🔴 **Watch now:** https://twitch.tv/${twitchUsername}\n\n` +
            `This bot was built live on stream with the global community!\n` +
            `Join anytime - we're coding around the clock! 🌍\n\n` +
            `*Unable to check live status right now, but check the link above!*`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
