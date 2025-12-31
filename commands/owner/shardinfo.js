const { EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
  name: 'shardinfo',
  description: 'Display detailed information about all shards',
  usage: 'shardinfo',
  category: 'owner',
  ownerOnly: true,
  cooldown: 5,

  async execute(message) {
    try {
      // Check if bot is sharded
      if (!message.client.shard) {
        return message.reply('❌ This bot is not running in sharded mode!');
      }

      const shardManager = message.client.shard;
      const currentShardId = shardManager.ids[0];

      // Fetch data from all shards
      const promises = [
        shardManager.fetchClientValues('guilds.cache.size'),
        shardManager.fetchClientValues('users.cache.size'),
        shardManager.fetchClientValues('channels.cache.size'),
        shardManager.fetchClientValues('ws.ping'),
        shardManager.fetchClientValues('uptime'),
      ];

      const results = await Promise.all(promises);
      const [guilds, users, channels, pings, uptimes] = results;

      const totalGuilds = guilds.reduce((acc, val) => acc + val, 0);
      const totalUsers = users.reduce((acc, val) => acc + val, 0);
      const totalChannels = channels.reduce((acc, val) => acc + val, 0);
      const avgPing = Math.round(
        pings.reduce((acc, val) => acc + val, 0) / pings.length
      );

      const embed = new EmbedBuilder()
        .setTitle('🔷 Shard Information')
        .setColor('#5865F2')
        .setDescription(
          `**Total Shards:** ${shardManager.count}\n**Current Shard:** ${currentShardId + 1}`
        )
        .addFields(
          {
            name: '📊 Global Statistics',
            value: [
              `**Total Guilds:** ${totalGuilds.toLocaleString()}`,
              `**Total Users:** ${totalUsers.toLocaleString()}`,
              `**Total Channels:** ${totalChannels.toLocaleString()}`,
              `**Average Ping:** ${avgPing}ms`,
            ].join('\n'),
            inline: false,
          },
          {
            name: '🔷 Individual Shard Stats',
            value:
              guilds
                .map((guildCount, index) => {
                  const isCurrent = index === currentShardId;
                  const status =
                    pings[index] < 200
                      ? '🟢'
                      : pings[index] < 500
                        ? '🟡'
                        : '🔴';
                  return (
                    `${status} **Shard ${index + 1}${isCurrent ? ' (Current)' : ''}**\n` +
                    `├ Guilds: ${guildCount.toLocaleString()}\n` +
                    `├ Users: ${users[index].toLocaleString()}\n` +
                    `├ Ping: ${Math.round(pings[index])}ms\n` +
                    `└ Uptime: ${ms(uptimes[index], { long: true })}`
                  );
                })
                .join('\n\n') || 'No shards available',
            inline: false,
          }
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in shardinfo command:', error);
      return message.reply(
        '❌ An error occurred while fetching shard information. Make sure the bot is running in sharded mode.'
      );
    }
  },
};
