const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

module.exports = {
  name: 'reload',
  aliases: ['refresh', 'r'],
  description: 'Reload a command or all commands (Owner Only)',
  usage: '[command name | all]',
  category: 'owner',
  ownerOnly: true,
  cooldown: 0,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please specify a command to reload or use `all` to reload all commands.\n' +
          'Usage: `reload <command>` or `reload all`'
      );
    }

    const commandName = args[0].toLowerCase();

    // Reload all commands
    if (commandName === 'all') {
      try {
        const reloadedCommands = [];
        const commandsPath = path.join(__dirname, '..');

        // Clear command cache
        message.client.commands.clear();

        // Reload all commands recursively
        function loadCommands(dir) {
          const files = fs.readdirSync(dir);

          for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
              loadCommands(filePath);
            } else if (file.endsWith('.js')) {
              try {
                // Delete from require cache
                delete require.cache[require.resolve(filePath)];

                // Reload command
                const command = require(filePath);
                if ('name' in command && 'execute' in command) {
                  message.client.commands.set(command.name, command);
                  reloadedCommands.push(command.name);
                }
              } catch (error) {
                logger.error(`Error reloading ${filePath}:`, error);
              }
            }
          }
        }

        loadCommands(commandsPath);

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ All Commands Reloaded')
          .setDescription(
            `Successfully reloaded **${reloadedCommands.length}** commands!\n\n` +
              `**Initiated by:** ${message.author.tag}`
          )
          .setTimestamp()
          .setFooter({
            text: '🔴 Owner Command | Vibe Bot',
            iconURL: message.client.user.displayAvatarURL(),
          });

        logger.info(
          `✅ All commands reloaded by ${message.author.tag} (${reloadedCommands.length} commands)`
        );

        return message.reply({ embeds: [embed] });
      } catch (error) {
        logger.error('Error reloading all commands:', error);
        return message.reply(
          `❌ Error reloading all commands: ${error.message}`
        );
      }
    }

    // Reload specific command
    const command =
      message.client.commands.get(commandName) ||
      message.client.commands.find(
        cmd => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) {
      return message.reply(
        `❌ Command \`${commandName}\` not found! Use \`reload all\` to reload all commands.`
      );
    }

    // Find the command file
    const commandsPath = path.join(__dirname, '..');
    let commandPath = null;

    function findCommand(dir) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          findCommand(filePath);
        } else if (file === `${command.name}.js`) {
          commandPath = filePath;
          return;
        }
      }
    }

    findCommand(commandsPath);

    if (!commandPath) {
      return message.reply(
        `❌ Could not find file for command \`${command.name}\`!`
      );
    }

    try {
      // Delete from require cache
      delete require.cache[require.resolve(commandPath)];

      // Reload command
      const newCommand = require(commandPath);
      message.client.commands.set(newCommand.name, newCommand);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Command Reloaded')
        .setDescription(
          `Successfully reloaded command: **${newCommand.name}**\n\n` +
            `**Category:** ${newCommand.category || 'Uncategorized'}\n` +
            `**Initiated by:** ${message.author.tag}`
        )
        .setTimestamp()
        .setFooter({
          text: '🔴 Owner Command | Vibe Bot',
          iconURL: message.client.user.displayAvatarURL(),
        });

      logger.info(
        `✅ Command '${newCommand.name}' reloaded by ${message.author.tag}`
      );

      return message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Error reloading command ${command.name}:`, error);
      return message.reply(
        `❌ Error reloading command \`${command.name}\`: ${error.message}`
      );
    }
  },
};
