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
          .setColor(0xff0000)
          .setTitle('🔴 LIVE NOW on Twitch!')
          .setURL(`https://twitch.tv/${twitchUsername}`)
          .setDescription(
            `**Airis** is currently live streaming!\n\n` +
              `🎵 Building Vibe Bot with the 24/7 community!\n` +
              `⏱️ **Uptime:** ${uptime}\n\n` +
              `[Click here to watch!](https://twitch.tv/${twitchUsername})`
          )
          .setThumbnail(
            `https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchUsername}-440x248.jpg?t=${Date.now()}`
          )
          .setFooter({
            text: 'Built 24/7 with the community',
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } else {
        // Stream is offline
        const embed = new EmbedBuilder()
          .setColor(0x808080)
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
          .setFooter({
            text: 'Built with ❤️ by Airis & The 24/7 Community',
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error checking Twitch stream:', error);

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
        .setFooter({
          text: 'Built with ❤️ by Airis & The 24/7 Community',
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
