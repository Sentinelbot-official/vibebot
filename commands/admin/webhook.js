const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'webhook',
  description: 'Manage webhooks',
  usage: '<create/list/delete/send> [name/id] [message]',
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageWebhooks)
    ) {
      return message.reply('❌ You need Manage Webhooks permission!');
    }

    const action = args[0]?.toLowerCase();

    if (action === 'create') {
      const name = args.slice(1).join(' ') || 'Bot Webhook';

      if (name.length > 80) {
        return message.reply('❌ Webhook name must be 80 characters or less!');
      }

      try {
        const webhook = await message.channel.createWebhook({
          name,
          avatar: message.client.user.displayAvatarURL(),
        });

        return message.reply(
          `✅ Webhook created!\n\n` +
            `**Name:** ${webhook.name}\n` +
            `**ID:** \`${webhook.id}\`\n` +
            `**URL:** ||(hidden for security)||\n\n` +
            `Use \`webhook send ${webhook.id} <message>\` to send messages`
        );
      } catch (error) {
        return message.reply(`❌ Failed to create webhook: ${error.message}`);
      }
    }

    if (action === 'list') {
      try {
        const webhooks = await message.channel.fetchWebhooks();

        if (!webhooks.size) {
          return message.reply('❌ No webhooks in this channel!');
        }

        const list = webhooks
          .map(
            w =>
              `**${w.name}**\n` +
              `ID: \`${w.id}\`\n` +
              `Created: <t:${Math.floor(w.createdTimestamp / 1000)}:R>`
          )
          .join('\n\n');

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🔗 Channel Webhooks')
          .setDescription(list)
          .setFooter({ text: `Total: ${webhooks.size} webhooks` })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (error) {
        return message.reply(`❌ Failed to fetch webhooks: ${error.message}`);
      }
    }

    if (action === 'delete') {
      const webhookId = args[1];

      if (!webhookId) {
        return message.reply(
          '❌ Please provide a webhook ID!\nUsage: `webhook delete <id>`\nUse `webhook list` to see IDs.'
        );
      }

      try {
        const webhooks = await message.channel.fetchWebhooks();
        const webhook = webhooks.get(webhookId);

        if (!webhook) {
          return message.reply('❌ Webhook not found in this channel!');
        }

        await webhook.delete();
        return message.reply(`✅ Deleted webhook **${webhook.name}**!`);
      } catch (error) {
        return message.reply(`❌ Failed to delete webhook: ${error.message}`);
      }
    }

    if (action === 'send') {
      const webhookId = args[1];
      const content = args.slice(2).join(' ');

      if (!webhookId || !content) {
        return message.reply(
          '❌ Usage: `webhook send <id> <message>`\nExample: `webhook send 123456789 Hello World!`'
        );
      }

      try {
        const webhooks = await message.channel.fetchWebhooks();
        const webhook = webhooks.get(webhookId);

        if (!webhook) {
          return message.reply('❌ Webhook not found in this channel!');
        }

        await webhook.send({
          content,
          username: message.author.username,
          avatarURL: message.author.displayAvatarURL(),
        });

        return message.reply('✅ Message sent via webhook!');
      } catch (error) {
        return message.reply(`❌ Failed to send message: ${error.message}`);
      }
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `webhook <create/list/delete/send>`\n\n' +
        '**Examples:**\n' +
        '`webhook create My Webhook` - Create a webhook\n' +
        '`webhook list` - List all webhooks in channel\n' +
        '`webhook delete 123456789` - Delete a webhook\n' +
        '`webhook send 123456789 Hello!` - Send message via webhook'
    );
  },
};
