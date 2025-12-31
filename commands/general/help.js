const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const prefix = process.env.PREFIX || '!';

module.exports = {
  name: 'help',
  description: 'List all commands or info about a specific command',
  usage: '[command]',
  category: 'general',
  execute(message, args) {
    const { commands } = message.client;

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

      // Add commands to their categories
      commands.forEach(cmd => {
        const category = cmd.category
          ? cmd.category.charAt(0).toUpperCase() + cmd.category.slice(1)
          : 'Uncategorized';

        if (!categories[category]) {
          categories[category] = [];
        }

        categories[category].push(cmd);
      });

      // Build embed
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor({
          name: `${message.client.user.username} Help`,
          iconURL: message.client.user.displayAvatarURL(),
        })
        .setDescription(
          `Use \`${prefix}help [command]\` for detailed information about a command.\n\u200b`
        )
        .setThumbnail(message.client.user.displayAvatarURL())
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Add fields for each category
      for (const [category, cmds] of Object.entries(categories)) {
        if (cmds.length > 0) {
          const commandList = cmds
            .map(cmd => {
              const desc = cmd.description ? ` - ${cmd.description}` : '';
              return `\`${cmd.name}\`${desc}`;
            })
            .join('\n');

          embed.addFields({
            name: `📂 ${category}`,
            value: commandList || 'No commands',
            inline: false,
          });
        }
      }

      message.channel.send({ embeds: [embed] });
    } else {
      // Show info about specific command
      const name = args[0].toLowerCase();
      const command = commands.get(name);

      if (!command) {
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

      message.channel.send({ embeds: [embed] });
    }
  },
};
