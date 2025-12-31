const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'autoresponder',
  description: 'Create automatic responses to specific triggers',
  usage: '<add/remove/list> [trigger] [response]',
  aliases: ['autoresponse', 'ar'],
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need the Manage Server permission to use this command!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'remove', 'list'].includes(action)) {
      return message.reply(
        '❌ Usage: `autoresponder <add/remove/list> [trigger] [response]`\nExample: `autoresponder add hello Hello there!`'
      );
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    const autoResponders = settings.autoResponders || [];

    if (action === 'list') {
      if (autoResponders.length === 0) {
        return message.reply(
          '❌ No auto-responders configured for this server.'
        );
      }

      const responderList = autoResponders
        .map(
          (ar, index) =>
            `**${index + 1}.** Trigger: \`${ar.trigger}\`\nResponse: ${ar.response}`
        )
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('⚙️ Auto-Responders')
        .setDescription(responderList)
        .setFooter({
          text: `${autoResponders.length} auto-responder(s) configured`,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'add') {
      if (args.length < 3) {
        return message.reply(
          '❌ Usage: `autoresponder add <trigger> <response>`\nExample: `autoresponder add hello Hello there!`'
        );
      }

      const trigger = args[1].toLowerCase();
      const response = args.slice(2).join(' ');

      if (trigger.length > 100) {
        return message.reply('❌ Trigger is too long! Maximum 100 characters.');
      }

      if (response.length > 1000) {
        return message.reply(
          '❌ Response is too long! Maximum 1000 characters.'
        );
      }

      // Check if trigger already exists
      if (autoResponders.some(ar => ar.trigger === trigger)) {
        return message.reply(
          '❌ An auto-responder with this trigger already exists!'
        );
      }

      if (autoResponders.length >= 50) {
        return message.reply('❌ Maximum of 50 auto-responders per server!');
      }

      autoResponders.push({
        trigger,
        response,
        createdBy: message.author.id,
        createdAt: Date.now(),
      });

      settings.autoResponders = autoResponders;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Auto-Responder Added')
        .addFields(
          { name: '🔔 Trigger', value: `\`${trigger}\``, inline: false },
          { name: '💬 Response', value: response, inline: false }
        )
        .setFooter({
          text: `Total: ${autoResponders.length} auto-responder(s)`,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'remove') {
      if (!args[1]) {
        return message.reply(
          '❌ Usage: `autoresponder remove <trigger>`\nExample: `autoresponder remove hello`'
        );
      }

      const trigger = args[1].toLowerCase();
      const index = autoResponders.findIndex(ar => ar.trigger === trigger);

      if (index === -1) {
        return message.reply('❌ No auto-responder found with that trigger!');
      }

      const removed = autoResponders.splice(index, 1)[0];
      settings.autoResponders = autoResponders;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Auto-Responder Removed')
        .addFields(
          {
            name: '🔔 Trigger',
            value: `\`${removed.trigger}\``,
            inline: false,
          },
          { name: '💬 Response', value: removed.response, inline: false }
        )
        .setFooter({
          text: `Total: ${autoResponders.length} auto-responder(s)`,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
