const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'shardbroadcast',
  aliases: ['sbroadcast', 'shardbc'],
  description:
    'Broadcast a message to all shards (execute code across all shards)',
  usage: 'shardbroadcast <message>',
  category: 'owner',
  ownerOnly: true,
  cooldown: 30,

  async execute(message, args) {
    try {
      // Check if bot is sharded
      if (!message.client.shard) {
        return message.reply('❌ This bot is not running in sharded mode!');
      }

      if (!args.length) {
        return message.reply(
          '❌ Please provide a message to broadcast!\n' +
            `Usage: \`${process.env.PREFIX || '//'}shardbroadcast <message>\``
        );
      }

      const broadcastMessage = args.join(' ');
      const shardManager = message.client.shard;

      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirm Shard Broadcast')
        .setDescription(
          `Are you sure you want to broadcast this message to all ${shardManager.count} shards?\n\n` +
            `**Message:** ${broadcastMessage}\n\n` +
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
        return message.reply('❌ Broadcast cancelled.');
      }

      const broadcastingEmbed = new EmbedBuilder()
        .setTitle('📡 Broadcasting to All Shards')
        .setDescription('Sending message to all shards...')
        .setColor('#FFA500')
        .setTimestamp();

      await message.reply({ embeds: [broadcastingEmbed] });

      // Broadcast to all shards
      const results = await shardManager.broadcastEval(
        (client, context) => {
          const logger = require('./utils/logger');
          logger.info(
            `[SHARD ${client.shard.ids[0]}] Broadcast: ${context.message}`
          );
          return {
            shardId: client.shard.ids[0],
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            success: true,
          };
        },
        { context: { message: broadcastMessage } }
      );

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Broadcast Complete')
        .setDescription(
          `Successfully broadcast message to all ${shardManager.count} shards!\n\n` +
            `**Message:** ${broadcastMessage}`
        )
        .addFields(
          results.map(result => ({
            name: `Shard ${result.shardId + 1}`,
            value: `✅ Received\n${result.guilds} guilds, ${result.users} users`,
            inline: true,
          }))
        )
        .setColor('#00FF00')
        .setTimestamp();

      return message.channel.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Error in shardbroadcast command:', error);
      return message.reply(
        '❌ An error occurred while broadcasting to shards. Check the console for details.'
      );
    }
  },
};
