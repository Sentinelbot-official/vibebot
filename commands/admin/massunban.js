const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'massunban',
  description: 'Unban all banned users',
  usage: '',
  aliases: ['unbanall', 'clearban'],
  category: 'admin',
  cooldown: 60,
  guildOnly: true,
  async execute(message, _args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    if (
      !message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)
    ) {
      return message.reply('❌ I need Ban Members permission!');
    }

    // Fetch all bans
    const msg = await message.reply('⏳ Fetching banned users...');

    try {
      const bans = await message.guild.bans.fetch();

      if (bans.size === 0) {
        return msg.edit('✅ No banned users found!');
      }

      // Confirmation
      await msg.edit(
        `⚠️ **WARNING:** This will unban **${bans.size} users**!\n` +
          'This action cannot be undone easily.\n\n' +
          'React with ✅ to confirm or ❌ to cancel.'
      );

      await msg.react('✅');
      await msg.react('❌');

      const filter = (reaction, user) => {
        return (
          ['✅', '❌'].includes(reaction.emoji.name) &&
          user.id === message.author.id
        );
      };

      const collector = msg.createReactionCollector({
        filter,
        max: 1,
        time: 30000,
      });

      collector.on('collect', async reaction => {
        if (reaction.emoji.name === '❌') {
          return msg.edit('❌ Mass unban cancelled.');
        }

        await msg.edit(`⏳ Unbanning ${bans.size} users...`);

        let unbanned = 0;
        let failed = 0;

        for (const [id, _ban] of bans) {
          try {
            await message.guild.members.unban(
              id,
              `Mass unban by ${message.author.tag}`
            );
            unbanned++;

            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Failed to unban ${id}:`, error);
            failed++;
          }
        }

        msg.edit(
          '✅ Mass unban complete!\n' +
            `**Unbanned:** ${unbanned}\n` +
            `**Failed:** ${failed}`
        );
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          msg.edit('❌ Mass unban timed out.');
        }
      });
    } catch (error) {
      console.error('Error fetching bans:', error);
      msg.edit('❌ Failed to fetch banned users!');
    }
  },
};
