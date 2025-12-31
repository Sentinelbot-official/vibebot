const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'confess',
  description: 'Send anonymous confessions',
  usage: '<setup/send> [channel/message]',
  aliases: ['confession', 'anonymous'],
  category: 'social',
  cooldown: 60,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (action === 'setup') {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply('❌ You need Manage Server permission!');
      }

      const channel = message.mentions.channels.first();

      if (!channel) {
        return message.reply(
          '❌ Please mention a channel!\nUsage: `confess setup #channel`'
        );
      }

      const settings = db.get('guild_settings', message.guild.id) || {};
      settings.confessionChannel = channel.id;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Confession channel set to ${channel}!\nUsers can now use \`confess send <message>\` to send anonymous confessions.`
      );
    }

    if (action === 'send') {
      const confession = args.slice(1).join(' ');

      if (!confession) {
        return message.reply(
          '❌ Please provide a confession!\nUsage: `confess send <message>`\nExample: `confess send I secretly love pineapple on pizza`'
        );
      }

      if (confession.length > 1000) {
        return message.reply('❌ Confession is too long! Max 1000 characters.');
      }

      const settings = db.get('guild_settings', message.guild.id) || {};
      const channelId = settings.confessionChannel;

      if (!channelId) {
        return message.reply(
          '❌ Confessions are not set up in this server!\nAsk an admin to use `confess setup #channel`'
        );
      }

      const channel = message.guild.channels.cache.get(channelId);

      if (!channel) {
        return message.reply(
          '❌ Confession channel not found! Ask an admin to set it up again.'
        );
      }

      // Get confession count
      const confessionData = db.get('confessions', message.guild.id) || {
        count: 0,
      };
      confessionData.count++;
      db.set('confessions', message.guild.id, confessionData);

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`📮 Anonymous Confession #${confessionData.count}`)
        .setDescription(confession)
        .setFooter({ text: 'Sent anonymously' })
        .setTimestamp();

      try {
        await channel.send({ embeds: [embed] });

        // Delete the user's message to maintain anonymity
        try {
          await message.delete();
        } catch (err) {
          // Bot might not have permission to delete
        }

        // Send confirmation in DM
        try {
          await message.author.send(
            `✅ Your confession has been sent anonymously to ${message.guild.name}!`
          );
        } catch (err) {
          // User has DMs disabled
        }

        return null; // Message already deleted
      } catch (error) {
        return message.reply(
          `❌ Failed to send confession: ${error.message}\nMake sure the bot has permission to send messages in the confession channel.`
        );
      }
    }

    if (action === 'status') {
      const settings = db.get('guild_settings', message.guild.id) || {};
      const channelId = settings.confessionChannel;

      if (!channelId) {
        return message.reply(
          '❌ Confessions are not set up in this server!\nUse `confess setup #channel` to set it up.'
        );
      }

      const channel = message.guild.channels.cache.get(channelId);
      const confessionData = db.get('confessions', message.guild.id) || {
        count: 0,
      };

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('📮 Confession Status')
        .addFields(
          {
            name: 'Channel',
            value: channel ? channel.toString() : 'Not found',
            inline: true,
          },
          {
            name: 'Total Confessions',
            value: confessionData.count.toString(),
            inline: true,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `confess <setup/send/status>`\n\n' +
        '**Examples:**\n' +
        '`confess setup #confessions` - Set up confession channel (Admin)\n' +
        '`confess send I love this server!` - Send anonymous confession\n' +
        '`confess status` - View confession stats'
    );
  },
};
