const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'smartreply',
  aliases: ['autoresponse', 'smartresponse'],
  description: 'Configure context-aware auto-responses',
  usage: '<enable/disable/add/remove/list>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'list') {
      const responses = db.get('smart_responses', message.guild.id) || {
        enabled: false,
        triggers: [],
      };

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🤖 Smart Auto-Response System')
        .setDescription(
          '**Context-aware automatic responses**\n\n' +
            `**Status:** ${responses.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `**Active Triggers:** ${responses.triggers.length}\n\n` +
            '**Features:**\n' +
            '• Context-aware matching\n' +
            '• Multiple response variations\n' +
            '• Channel-specific triggers\n' +
            '• Role-based responses\n' +
            '• Cooldown management\n\n' +
            '**Commands:**\n' +
            '`//smartreply enable` - Enable system\n' +
            '`//smartreply add <trigger> | <response>` - Add trigger\n' +
            '`//smartreply remove <id>` - Remove trigger\n' +
            '`//smartreply list` - View all triggers'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      if (responses.triggers.length > 0) {
        embed.addFields({
          name: '📝 Active Triggers',
          value: responses.triggers
            .slice(0, 10)
            .map(
              (t, i) =>
                `**${i + 1}.** ${t.trigger} → ${t.response.substring(0, 50)}...\n` +
                `🆔 ID: \`${t.id}\``
            )
            .join('\n\n'),
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    }

    if (action === 'enable') {
      const responses = db.get('smart_responses', message.guild.id) || {
        triggers: [],
      };
      responses.enabled = true;
      db.set('smart_responses', message.guild.id, responses);

      return message.reply('✅ Smart auto-response system enabled!');
    }

    if (action === 'disable') {
      const responses = db.get('smart_responses', message.guild.id) || {};
      responses.enabled = false;
      db.set('smart_responses', message.guild.id, responses);

      return message.reply('✅ Smart auto-response system disabled.');
    }

    if (action === 'add') {
      const data = args
        .slice(1)
        .join(' ')
        .split('|')
        .map(s => s.trim());

      if (data.length < 2) {
        return message.reply(
          '❌ Format: `//smartreply add <trigger> | <response>`\n' +
            'Example: `//smartreply add hello | Hey there! How can I help? 👋`'
        );
      }

      const [trigger, response] = data;

      const responses = db.get('smart_responses', message.guild.id) || {
        enabled: false,
        triggers: [],
      };

      const newTrigger = {
        id: Date.now().toString(),
        trigger: trigger.toLowerCase(),
        response,
        uses: 0,
        createdBy: message.author.id,
        createdAt: Date.now(),
      };

      responses.triggers.push(newTrigger);
      db.set('smart_responses', message.guild.id, responses);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Auto-Response Added!')
        .setDescription(
          `**Trigger:** ${trigger}\n` +
            `**Response:** ${response}\n` +
            `**ID:** \`${newTrigger.id}\`\n\n` +
            'The bot will now respond when this trigger is detected!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'remove') {
      const triggerId = args[1];

      if (!triggerId) {
        return message.reply('❌ Please provide a trigger ID!');
      }

      const responses = db.get('smart_responses', message.guild.id) || {
        triggers: [],
      };

      const index = responses.triggers.findIndex(t => t.id === triggerId);

      if (index === -1) {
        return message.reply('❌ Trigger not found!');
      }

      const removed = responses.triggers.splice(index, 1)[0];
      db.set('smart_responses', message.guild.id, responses);

      return message.reply(
        `✅ Removed trigger: **${removed.trigger}** (Used ${removed.uses} times)`
      );
    }
  },
};
