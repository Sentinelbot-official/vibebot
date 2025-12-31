const { ChannelType, PermissionsBitField } = require('discord.js');
const db = require('../utils/database');
const logger = require('../utils/logger');

const tempChannels = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      const settings = db.get('guild_settings', newState.guild.id) || {};
      if (!settings.tempVoice?.enabled) return;

      const joinChannelId = settings.tempVoice.channelId;

      // User joined the temp voice creator channel
      if (newState.channelId === joinChannelId && !oldState.channelId) {
        const member = newState.member;
        const category = newState.channel.parent;

        const tempChannel = await newState.guild.channels.create({
          name: `${member.user.username}'s Channel`,
          type: ChannelType.GuildVoice,
          parent: category,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.MoveMembers,
              ],
            },
          ],
        });

        await member.voice.setChannel(tempChannel);
        tempChannels.set(tempChannel.id, {
          ownerId: member.id,
          createdAt: Date.now(),
        });

        logger.info(`Created temp voice channel for ${member.user.tag}`);
      }

      // User left a temp channel
      if (oldState.channelId && tempChannels.has(oldState.channelId)) {
        const channel = oldState.guild.channels.cache.get(oldState.channelId);

        if (channel && channel.members.size === 0) {
          await channel.delete();
          tempChannels.delete(oldState.channelId);
          logger.info(`Deleted empty temp voice channel`);
        }
      }
    } catch (error) {
      logger.error('Error in temp voice handler:', error);
    }
  },
};
