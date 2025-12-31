const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'restartshard',
  description: 'Restart a specific shard or all shards',
  usage: 'restartshard <shard_id|all>',
  category: 'owner',
  ownerOnly: true,
  cooldown: 10,

  async execute(message, args) {
    try {
      // Check if bot is sharded
      if (!message.client.shard) {
        return message.reply('❌ This bot is not running in sharded mode!');
      }

      if (!args[0]) {
        return message.reply(
          '❌ Please specify a shard ID or `all` to restart all shards!\n' +
            `Usage: \`${process.env.PREFIX || '//'}restartshard <shard_id|all>\``
        );
      }

      const shardManager = message.client.shard;
      const input = args[0].toLowerCase();

      if (input === 'all') {
        const confirmEmbed = new EmbedBuilder()
          .setTitle('⚠️ Confirm Shard Restart')
          .setDescription(
            `Are you sure you want to restart **all ${shardManager.count} shards**?\n\n` +
              '**This will cause temporary downtime for all servers!**\n\n' +
              'Reply with `yes` to confirm or `no` to cancel.'
          )
          .setColor('#FFA500')
          .setTimestamp();

        await message.reply({ embeds: [confirmEmbed] });

        const filter = m =>
          m.author.id === message.author.id &&
          ['yes', 'no'].includes(m.content.toLowerCase());
        const collected = await message.channel
          .awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
          .catch(() => null);

        if (!collected || collected.first().content.toLowerCase() === 'no') {
          return message.reply('❌ Shard restart cancelled.');
        }

        const restartEmbed = new EmbedBuilder()
          .setTitle('🔄 Restarting All Shards')
          .setDescription(
            `Restarting all ${shardManager.count} shards... This may take a few moments.`
          )
          .setColor('#FFA500')
          .setTimestamp();

        await message.reply({ embeds: [restartEmbed] });

        // Restart all shards
        await shardManager.respawnAll({
          shardDelay: 5000,
          respawnDelay: 5000,
          timeout: 30000,
        });

        // Note: This message might not send if the current shard restarts before it can be sent
        const successEmbed = new EmbedBuilder()
          .setTitle('✅ All Shards Restarted')
          .setDescription('All shards have been successfully restarted!')
          .setColor('#00FF00')
          .setTimestamp();

        return message.channel.send({ embeds: [successEmbed] }).catch(() => {
          // Ignore error if shard restarted before message could be sent
        });
      } else {
        const shardId = parseInt(input);

        if (isNaN(shardId) || shardId < 0 || shardId >= shardManager.count) {
          return message.reply(
            `❌ Invalid shard ID! Please provide a number between 0 and ${shardManager.count - 1}.`
          );
        }

        const restartEmbed = new EmbedBuilder()
          .setTitle('🔄 Restarting Shard')
          .setDescription(`Restarting Shard ${shardId + 1}...`)
          .setColor('#FFA500')
          .setTimestamp();

        await message.reply({ embeds: [restartEmbed] });

        // Restart specific shard
        await shardManager.respawnAll({
          shardDelay: 5000,
          respawnDelay: 5000,
          timeout: 30000,
          shardFilter: shard => shard.id === shardId,
        });

        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Shard Restarted')
          .setDescription(
            `Shard ${shardId + 1} has been successfully restarted!`
          )
          .setColor('#00FF00')
          .setTimestamp();

        return message.channel.send({ embeds: [successEmbed] }).catch(() => {
          // Ignore error if current shard was restarted
        });
      }
    } catch (error) {
      console.error('Error in restartshard command:', error);
      return message.reply(
        '❌ An error occurred while restarting the shard(s). Check the console for details.'
      );
    }
  },
};
