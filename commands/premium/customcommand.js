const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');

module.exports = {
  name: 'customcommand',
  description: 'Create custom commands (VIP only)',
  usage: '//customcommand <add/remove/list/edit> [name] [response]',
  aliases: ['cc', 'customcmd'],
  category: 'premium',
  cooldown: 5,
  async execute(message, args) {
    const guildId = message.guild.id;

    // Check VIP
    if (!premiumPerks.hasFeature(guildId, 'custom_commands')) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ VIP Required')
        .setDescription(
          'This feature requires **VIP**!\n\n' +
            '**VIP Benefits:**\n' +
            '• Create up to 50 custom commands\n' +
            '• AI chatbot\n' +
            '• Auto-posting system\n' +
            '• All Premium features\n' +
            '• And more!\n\n' +
            'Use `//premium` to learn more!'
        )
        .setFooter({ text: 'Support the 24/7 live coding journey! 💜' });

      return message.reply({ embeds: [embed] });
    }

    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need the **Manage Server** permission to manage custom commands!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'remove', 'list', 'edit'].includes(action)) {
      const customCommands = db.get('custom_commands', guildId) || {};
      const commandCount = Object.keys(customCommands).length;
      const limit = premiumPerks.getLimit(guildId, 'maxCustomCommands');

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔧 Custom Commands')
        .setDescription(
          '**Create your own custom commands!**\n\n' +
            '**Commands:**\n' +
            '`//cc add <name> <response>` - Add custom command\n' +
            '`//cc remove <name>` - Remove custom command\n' +
            '`//cc edit <name> <new_response>` - Edit custom command\n' +
            '`//cc list` - List all custom commands\n\n' +
            '**Variables:**\n' +
            '• `{user}` - User mention\n' +
            '• `{user.name}` - Username\n' +
            '• `{server}` - Server name\n' +
            '• `{channel}` - Channel mention\n' +
            '• `{membercount}` - Member count\n\n' +
            '**Example:**\n' +
            '`//cc add hello Hello {user}! Welcome to {server}!`'
        )
        .addFields({
          name: '📊 Your Stats',
          value: `**Commands:** ${commandCount}/${limit}\n**Tier:** 👑 VIP`,
          inline: false,
        })
        .setFooter({ text: 'VIP Feature 👑' });

      return message.reply({ embeds: [embed] });
    }

    const customCommands = db.get('custom_commands', guildId) || {};

    if (action === 'list') {
      if (Object.keys(customCommands).length === 0) {
        return message.reply('📭 No custom commands configured!');
      }

      const commandList = Object.entries(customCommands)
        .map(
          ([name, data]) =>
            `**${name}** - ${data.response.substring(0, 50)}${data.response.length > 50 ? '...' : ''}`
        )
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🔧 Custom Commands')
        .setDescription(commandList)
        .setFooter({
          text: `Total: ${Object.keys(customCommands).length}/${premiumPerks.getLimit(guildId, 'maxCustomCommands')} | VIP Feature 👑`,
        });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'add') {
      const commandName = args[1]?.toLowerCase();
      const response = args.slice(2).join(' ');

      if (!commandName || !response) {
        return message.reply(
          '❌ Usage: `//cc add <name> <response>`\n' +
            'Example: `//cc add hello Hello {user}!`'
        );
      }

      // Validate command name
      if (!/^[a-z0-9_-]+$/.test(commandName)) {
        return message.reply(
          '❌ Command name can only contain lowercase letters, numbers, hyphens, and underscores!'
        );
      }

      if (commandName.length > 32) {
        return message.reply('❌ Command name must be 32 characters or less!');
      }

      // Check if command already exists
      if (customCommands[commandName]) {
        return message.reply(
          `❌ Command \`${commandName}\` already exists! Use \`//cc edit\` to modify it.`
        );
      }

      // Check limit
      const limit = premiumPerks.getLimit(guildId, 'maxCustomCommands');
      if (Object.keys(customCommands).length >= limit) {
        return message.reply(
          `❌ You've reached your custom command limit! (${limit})\n` +
            'Remove some commands to add new ones.'
        );
      }

      // Add command
      customCommands[commandName] = {
        response,
        createdBy: message.author.id,
        createdAt: Date.now(),
        uses: 0,
      };

      db.set('custom_commands', guildId, customCommands);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Custom Command Added!')
        .setDescription(
          `**Command:** \`//${commandName}\`\n` +
            `**Response:** ${response}\n\n` +
            'Users can now use this command!'
        )
        .setFooter({ text: 'VIP Feature 👑' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'remove') {
      const commandName = args[1]?.toLowerCase();

      if (!commandName) {
        return message.reply('❌ Please specify a command name to remove!');
      }

      if (!customCommands[commandName]) {
        return message.reply(`❌ Command \`${commandName}\` not found!`);
      }

      delete customCommands[commandName];
      db.set('custom_commands', guildId, customCommands);

      return message.reply(`✅ Custom command \`${commandName}\` removed!`);
    }

    if (action === 'edit') {
      const commandName = args[1]?.toLowerCase();
      const newResponse = args.slice(2).join(' ');

      if (!commandName || !newResponse) {
        return message.reply(
          '❌ Usage: `//cc edit <name> <new_response>`\n' +
            'Example: `//cc edit hello Hi there {user}!`'
        );
      }

      if (!customCommands[commandName]) {
        return message.reply(`❌ Command \`${commandName}\` not found!`);
      }

      customCommands[commandName].response = newResponse;
      customCommands[commandName].editedBy = message.author.id;
      customCommands[commandName].editedAt = Date.now();

      db.set('custom_commands', guildId, customCommands);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Custom Command Updated!')
        .setDescription(
          `**Command:** \`//${commandName}\`\n` +
            `**New Response:** ${newResponse}`
        )
        .setFooter({ text: 'VIP Feature 👑' });

      return message.reply({ embeds: [embed] });
    }
  },
};
