const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../utils/database');
const ownerCheck = require('../../utils/ownerCheck');

module.exports = {
  name: 'help',
  description: 'List all commands or info about a specific command',
  usage: '[command]',
  category: 'general',
  execute(message, args) {
    const { commands } = message.client;

    // Get custom prefix for this server or use default
    const settings = db.get('guild_settings', message.guild.id) || {};
    const prefix = settings.prefix || process.env.PREFIX || '//';

    if (!args.length) {
      // Group commands by category
      const categories = {};
      const commandsPath = path.join(__dirname, '..');

      // Get all subdirectories in commands folder
      const getCategories = dir => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory()) {
            const categoryName =
              item.name.charAt(0).toUpperCase() + item.name.slice(1);
            categories[categoryName] = [];
          }
        }
      };

      getCategories(commandsPath);

      // Check if user is owner
      const isOwner = ownerCheck.isOwner(message.author.id);

      // Add commands to their categories
      commands.forEach(cmd => {
        // Skip owner-only commands for non-owners
        if (cmd.ownerOnly && !isOwner) {
          return;
        }

        const category = cmd.category
          ? cmd.category.charAt(0).toUpperCase() + cmd.category.slice(1)
          : 'Uncategorized';

        if (!categories[category]) {
          categories[category] = [];
        }

        categories[category].push(cmd);
      });

      // Count visible commands
      const visibleCommands = Array.from(commands.values()).filter(
        cmd => !cmd.ownerOnly || isOwner
      ).length;

      // Build embed with personality!
      const embed = new EmbedBuilder()
        .setColor(isOwner ? 0xff0000 : 0x9b59b6) // Red for owners, purple for users
        .setAuthor({
          name: `🎵 ${message.client.user.username} - Built 24/7 Live on Twitch!`,
          iconURL: message.client.user.displayAvatarURL(),
        })
        .setDescription(
          `**Hey there!** 👋 I'm Vibe Bot, created on a 24/7 live stream with the global community!\n\n` +
            `🔴 **LIVE NOW (24/7):** https://twitch.tv/projectdraguk\n` +
            `💜 **${visibleCommands} commands** coded live with chat!\n` +
            `⚡ **Prefix:** \`${prefix}\`\n` +
            `🌍 **Built by viewers worldwide, any time, day or night!**\n` +
            (isOwner
              ? `\n🔴 **Owner Mode Active** - Showing all commands including owner-only\n`
              : '') +
            `\nUse \`${prefix}help [command]\` for info about a command.\n` +
            `Use \`${prefix}help [category]\` to view all commands in a category.\n` +
            `**Let's vibe together!** 🎵\n\u200b`
        )
        .setThumbnail(message.client.user.displayAvatarURL())
        .setFooter({
          text: `Requested by ${message.author.tag} | Built with ❤️ by Airis & Community`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Add fields for each category
      for (const [category, cmds] of Object.entries(categories)) {
        if (cmds.length > 0) {
          // Just show command names without descriptions to save space
          const commandList = cmds.map(cmd => `\`${cmd.name}\``).join(', ');

          // Check if field value is within Discord's 1024 character limit
          if (commandList.length > 1024) {
            // Split into multiple fields if too long
            const cmdNames = cmds.map(cmd => `\`${cmd.name}\``);
            let currentChunk = '';
            let chunkIndex = 1;

            for (const cmdName of cmdNames) {
              if ((currentChunk + cmdName).length > 1000) {
                embed.addFields({
                  name: `📂 ${category} (${chunkIndex})`,
                  value: currentChunk,
                  inline: false,
                });
                currentChunk = `${cmdName}, `;
                chunkIndex++;
              } else {
                currentChunk += `${cmdName}, `;
              }
            }

            if (currentChunk) {
              embed.addFields({
                name: `📂 ${category} (${chunkIndex})`,
                value: currentChunk.slice(0, -2), // Remove trailing comma
                inline: false,
              });
            }
          } else {
            embed.addFields({
              name: `📂 ${category} (${cmds.length} commands)`,
              value: commandList || 'No commands',
              inline: false,
            });
          }
        }
      }

      return message.channel.send({ embeds: [embed] });
    } else {
      // Show info about specific command or category
      const name = args[0].toLowerCase();
      const command = commands.get(name);

      // Check if user is owner
      const isOwner = ownerCheck.isOwner(message.author.id);

      // If not a command, check if it's a category
      if (!command) {
        const categoryName = name.charAt(0).toUpperCase() + name.slice(1);
        const categoryCommands = Array.from(commands.values()).filter(
          cmd => cmd.category && cmd.category.toLowerCase() === name.toLowerCase() &&
          (!cmd.ownerOnly || isOwner)
        );

        if (categoryCommands.length > 0) {
          // Show all commands in this category
          const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle(`📂 ${categoryName} Commands`)
            .setDescription(
              `Here are all the commands in the **${categoryName}** category:\n\u200b`
            )
            .setFooter({
              text: `Use ${prefix}help [command] for detailed info | ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp();

          // Add each command with its description
          categoryCommands.forEach(cmd => {
            embed.addFields({
              name: `${prefix}${cmd.name}`,
              value: cmd.description || 'No description available',
              inline: false,
            });
          });

          return message.channel.send({ embeds: [embed] });
        }

        return message.reply("❌ That's not a valid command or category!");
      }

      // Hide owner-only commands from non-owners
      if (command.ownerOnly && !isOwner) {
        return message.reply("❌ That's not a valid command!");
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`📖 Command: ${command.name}`)
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      if (command.description) {
        embed.addFields({
          name: '📝 Description',
          value: command.description,
          inline: false,
        });
      }

      if (command.usage) {
        embed.addFields({
          name: '💡 Usage',
          value: `\`${prefix}${command.name} ${command.usage}\``,
          inline: false,
        });
      }

      if (command.category) {
        embed.addFields({
          name: '📂 Category',
          value:
            command.category.charAt(0).toUpperCase() +
            command.category.slice(1),
          inline: true,
        });
      }

      return message.channel.send({ embeds: [embed] });
    }
  },
};
