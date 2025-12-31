const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;
    if (reaction.emoji.name !== '⭐') return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        return;
      }
    }

    const message = reaction.message;
    if (!message.guild) return;

    const settings = db.get('guild_settings', message.guild.id) || {};
    const starboardSettings = settings.starboard || {};

    if (!starboardSettings.enabled || !starboardSettings.channelId) return;

    const starCount = reaction.count;
    const threshold = starboardSettings.threshold || 5;

    if (starCount < threshold) return;

    const starboardChannel = message.guild.channels.cache.get(
      starboardSettings.channelId
    );
    if (!starboardChannel) return;

    // Check if already posted
    const starboard = db.get('starboard', message.guild.id) || {};
    if (starboard[message.id]) {
      // Update existing starboard message
      try {
        const starMsg = await starboardChannel.messages.fetch(
          starboard[message.id]
        );
        const embed = EmbedBuilder.from(starMsg.embeds[0]);
        embed.setDescription(`⭐ **${starCount}** | ${message.channel}`);
        await starMsg.edit({ embeds: [embed] });
      } catch (error) {
        // Message might have been deleted
      }
      return;
    }

    // Create new starboard entry
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setDescription(
        `⭐ **${starCount}** | ${message.channel}\n\n` +
          `${message.content || '*[No content]*'}\n\n` +
          `[Jump to Message](${message.url})`
      )
      .setTimestamp(message.createdAt);

    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (attachment.contentType?.startsWith('image/')) {
        embed.setImage(attachment.url);
      }
    }

    const starMsg = await starboardChannel.send({ embeds: [embed] });

    starboard[message.id] = starMsg.id;
    db.set('starboard', message.guild.id, starboard);
  },
};
