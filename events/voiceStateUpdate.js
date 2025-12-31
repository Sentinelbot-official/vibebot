const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const settings = db.get('guild_settings', newState.guild.id) || {};
    if (!settings.logChannel) return;

    const logChannel = newState.guild.channels.cache.get(settings.logChannel);
    if (!logChannel) return;

    const member = newState.member;
    let description = '';
    let color = 0x0099ff;

    // User joined a voice channel
    if (!oldState.channel && newState.channel) {
      description = `🔊 ${member} joined voice channel ${newState.channel}`;
      color = 0x00ff00;
    }
    // User left a voice channel
    else if (oldState.channel && !newState.channel) {
      description = `🔇 ${member} left voice channel ${oldState.channel}`;
      color = 0xff0000;
    }
    // User switched voice channels
    else if (
      oldState.channel &&
      newState.channel &&
      oldState.channel.id !== newState.channel.id
    ) {
      description = `🔀 ${member} switched from ${oldState.channel} to ${newState.channel}`;
      color = 0xffa500;
    }
    // User muted/unmuted
    else if (oldState.selfMute !== newState.selfMute) {
      description = newState.selfMute
        ? `🔇 ${member} muted themselves in ${newState.channel}`
        : `🔊 ${member} unmuted themselves in ${newState.channel}`;
    }
    // User deafened/undeafened
    else if (oldState.selfDeaf !== newState.selfDeaf) {
      description = newState.selfDeaf
        ? `🔇 ${member} deafened themselves in ${newState.channel}`
        : `🔊 ${member} undeafened themselves in ${newState.channel}`;
    }
    // User started/stopped streaming
    else if (oldState.streaming !== newState.streaming) {
      description = newState.streaming
        ? `📹 ${member} started streaming in ${newState.channel}`
        : `📹 ${member} stopped streaming in ${newState.channel}`;
      color = 0x9b59b6;
    }
    // User started/stopped video
    else if (oldState.selfVideo !== newState.selfVideo) {
      description = newState.selfVideo
        ? `📹 ${member} turned on their camera in ${newState.channel}`
        : `📹 ${member} turned off their camera in ${newState.channel}`;
    }

    // Only log significant changes
    if (!description) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setFooter({ text: `User ID: ${member.id}` })
      .setTimestamp();

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error logging voice state:', error);
    }
  },
};
