const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'serverinfo',
  description: 'Get information about this server.',
  usage: '',
  category: 'general',
  async execute(message, args) {
    const guild = message.guild;
    if (!guild) {
      return message.reply('❌ This command can only be used in a server.');
    }

    // Get owner as mention
    let ownerMention;
    try {
      const owner = await guild.fetchOwner();
      ownerMention = owner.user ? `<@${owner.user.id}>` : 'Unknown';
    } catch (err) {
      ownerMention = 'Unknown';
    }

    const iconURL = guild.iconURL({ dynamic: true, size: 256 });
    const createdAt = `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>`;
    const memberCount = guild.memberCount;
    const channels = guild.channels.cache.filter(
      ch => ch.type === 0 || ch.type === 2 || ch.type === 4
    );
    const textChannels = guild.channels.cache.filter(ch => ch.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(ch => ch.type === 2).size;
    const categories = guild.channels.cache.filter(ch => ch.type === 4).size;

    const roleCount = guild.roles.cache.size;
    const emojiCount = guild.emojis.cache.size;

    // Boost info
    const boostCount = guild.premiumSubscriptionCount;
    const boostTier = guild.premiumTier ? `${guild.premiumTier}` : 'None';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Server Info: ${guild.name}`)
      .setThumbnail(iconURL)
      .addFields(
        { name: '👑 Owner', value: ownerMention, inline: true },
        { name: '🆔 Server ID', value: guild.id, inline: true },
        { name: '📅 Created', value: createdAt, inline: true },
        { name: '👥 Members', value: `${memberCount}`, inline: true },
        { name: '💬 Text Channels', value: `${textChannels}`, inline: true },
        { name: '🔊 Voice Channels', value: `${voiceChannels}`, inline: true },
        { name: '📁 Categories', value: `${categories}`, inline: true },
        { name: '🔢 Roles', value: `${roleCount}`, inline: true },
        { name: '😃 Emojis', value: `${emojiCount}`, inline: true },
        {
          name: '🚀 Boosts',
          value: `${boostCount} (Tier ${boostTier})`,
          inline: true,
        }
      )
      .setFooter({ text: `Server Info for "${guild.name}"` });

    message.reply({ embeds: [embed] });
  },
};
