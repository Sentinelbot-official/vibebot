const { EmbedBuilder } = require('discord.js');
const util = require('util');

module.exports = {
  name: 'shardeval',
  aliases: ['seval', 'shardexec'],
  description: 'Evaluate code on a specific shard or all shards',
  usage: 'shardeval <shard_id|all> <code>',
  category: 'owner',
  ownerOnly: true,
  cooldown: 5,

  async execute(message, args) {
    try {
      // Check if bot is sharded
      if (!message.client.shard) {
        return message.reply('❌ This bot is not running in sharded mode!');
      }

      if (args.length < 2) {
        return message.reply(
          '❌ Please provide a shard ID (or `all`) and code to evaluate!\n' +
            `Usage: \`${process.env.PREFIX || '//'}shardeval <shard_id|all> <code>\`\n\n` +
            '**Examples:**\n' +
            `\`${process.env.PREFIX || '//'}shardeval all client.guilds.cache.size\`\n` +
            `\`${process.env.PREFIX || '//'}shardeval 0 client.ws.ping\``
        );
      }

      const shardManager = message.client.shard;
      const target = args[0].toLowerCase();
      const code = args.slice(1).join(' ');

      let results;
      let shardIds;

      if (target === 'all') {
        shardIds = Array.from({ length: shardManager.count }, (_, i) => i);
        results = await shardManager.broadcastEval(code);
      } else {
        const shardId = parseInt(target);

        if (isNaN(shardId) || shardId < 0 || shardId >= shardManager.count) {
          return message.reply(
            `❌ Invalid shard ID! Please provide a number between 0 and ${shardManager.count - 1}, or \`all\`.`
          );
        }

        shardIds = [shardId];
        results = [
          await shardManager.broadcastEval(code, {
            shard: shardId,
          }),
        ];
      }

      // Format results
      const formattedResults = results.map((result, index) => {
        const shardId = shardIds[index] !== undefined ? shardIds[index] : index;
        let output;

        try {
          output = util.inspect(result, { depth: 0, maxArrayLength: 10 });
        } catch (err) {
          output = String(result);
        }

        // Truncate if too long
        if (output.length > 1000) {
          output = output.substring(0, 997) + '...';
        }

        return `**Shard ${shardId + 1}:**\n\`\`\`js\n${output}\n\`\`\``;
      });

      const embed = new EmbedBuilder()
        .setTitle('🔷 Shard Eval Results')
        .setDescription(
          `**Code:**\n\`\`\`js\n${code}\n\`\`\`\n\n` +
            formattedResults.join('\n\n')
        )
        .setColor('#5865F2')
        .setFooter({
          text: `Executed by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      // If description is too long, split into multiple embeds or send as file
      if (embed.data.description.length > 4096) {
        const output = `Code:\n${code}\n\n${formattedResults.join('\n\n')}`;
        const buffer = Buffer.from(output, 'utf-8');

        return message.reply({
          content: '📄 Output too long, sent as file:',
          files: [{ attachment: buffer, name: 'shardeval-output.txt' }],
        });
      }

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in shardeval command:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Evaluation Error')
        .setDescription(
          `\`\`\`js\n${error.message || error}\n\`\`\`\n\n` +
            '**Stack Trace:**\n' +
            `\`\`\`\n${error.stack || 'No stack trace available'}\n\`\`\``
        )
        .setColor('#FF0000')
        .setTimestamp();

      return message.reply({ embeds: [errorEmbed] });
    }
  },
};
