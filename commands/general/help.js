const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../utils/database');
const ownerCheck = require('../../utils/ownerCheck');
const premium = require('../../utils/premium');
const branding = require('../../utils/branding');

module.exports = {
  name: 'help',
  description: 'List all commands or info about a specific command with search',
  usage: '[command|category|search <query>]',
  category: 'general',
  async execute(message, args) {
    const { commands } = message.client;

    // Get custom prefix for this server or use default
    const settings = db.get('guild_settings', message.guild.id) || {};
    const prefix = settings.prefix || process.env.PREFIX || '//';

    // Get premium status
    const tierName = premium.getServerTier(message.guild.id);
    const isPremium = tierName !== 'Free';

    // Check if it's a search query
    if (args[0] && args[0].toLowerCase() === 'search') {
      const query = args.slice(1).join(' ').toLowerCase();
      if (!query) {
        return message.reply(
          '❌ Please provide a search query! Example: `//help search economy`'
        );
      }

      const isOwner = ownerCheck.isOwner(message.author.id);
      const results = Array.from(commands.values()).filter(cmd => {
        if (cmd.ownerOnly && !isOwner) return false;
        return (
          cmd.name.toLowerCase().includes(query) ||
          (cmd.description && cmd.description.toLowerCase().includes(query)) ||
          (cmd.category && cmd.category.toLowerCase().includes(query)) ||
          (cmd.aliases &&
            cmd.aliases.some(a => a.toLowerCase().includes(query)))
        );
      });

      if (results.length === 0) {
        return message.reply(`❌ No commands found matching **"${query}"**`);
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`${branding.emojis.vibe} Search Results for "${query}"`)
        .setDescription(
          `Found **${results.length}** command${results.length !== 1 ? 's' : ''}! ${branding.emojis.sparkles}\n\u200b`
        )
        .setAuthor({
          name: branding.getTagline(),
          iconURL: branding.footers.default.iconURL,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      results.slice(0, 15).forEach(cmd => {
        const premiumBadge = cmd.premiumOnly ? '💎 ' : '';
        const ownerBadge = cmd.ownerOnly ? '👑 ' : '';
        embed.addFields({
          name: `${premiumBadge}${ownerBadge}${prefix}${cmd.name}`,
          value: cmd.description || 'No description',
          inline: false,
        });
      });

      if (results.length > 15) {
        embed.setDescription(
          `Found ${results.length} commands (showing first 15):\n\u200b`
        );
      }

      return message.reply({ embeds: [embed] });
    }

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

      // Count premium commands
      const premiumCommands = Array.from(commands.values()).filter(
        cmd => cmd.premiumOnly && (!cmd.ownerOnly || isOwner)
      ).length;

      // Pagination setup
      const categoryEntries = Object.entries(categories).filter(
        ([_, cmds]) => cmds.length > 0
      );
      const categoriesPerPage = 5;
      let currentPage = 0;
      const totalPages = Math.ceil(categoryEntries.length / categoriesPerPage);

      const generateEmbed = page => {
        const start = page * categoriesPerPage;
        const end = start + categoriesPerPage;
        const pageCategories = categoryEntries.slice(start, end);

        // Build embed with personality!
        const embed = new EmbedBuilder()
          .setColor(
            isOwner
              ? branding.colors.error
              : isPremium
                ? branding.colors.premium
                : branding.colors.primary
          )
          .setAuthor({
            name: `${branding.emojis.vibe} ${message.client.user.username} - ${branding.getTagline()}`,
            iconURL: message.client.user.displayAvatarURL(),
          })
          .setDescription(
            `**Hey there!** ${branding.emojis.community} I'm Vibe Bot, created on a 24/7 live stream with the global community!\n\n` +
              `${branding.emojis.live} **LIVE NOW (24/7):** https://twitch.tv/projectdraguk\n` +
              `${branding.emojis.community} **${branding.formatNumber(visibleCommands)} commands** coded live with chat!\n` +
              (premiumCommands > 0
                ? `💎 **${premiumCommands} premium commands** available!\n`
                : '') +
              `⚡ **Prefix:** \`${prefix}\`\n` +
              (isPremium
                ? `${branding.emojis.sparkles} **Premium Server** - ${tierName} Tier Active!\n`
                : '') +
              `🌍 **Built by viewers worldwide, any time, day or night!**\n` +
              (isOwner
                ? `\n${branding.emojis.fire} **Owner Mode Active** - Showing all commands including owner-only\n`
                : '') +
              `\n📖 \`${prefix}help [command]\` - Info about a command\n` +
              `📂 \`${prefix}help [category]\` - View category commands\n` +
              `🔍 \`${prefix}help search <query>\` - Search commands\n` +
              `**Let's vibe together!** ${branding.emojis.vibe}\n\u200b`
          )
          .setThumbnail(message.client.user.displayAvatarURL())
          .setFooter(branding.footers.default)
          .setTimestamp();

        // Add fields for each category on this page
        for (const [category, cmds] of pageCategories) {
          // Count premium commands in this category
          const premiumCount = cmds.filter(cmd => cmd.premiumOnly).length;
          const categoryTitle =
            premiumCount > 0
              ? `📂 ${category} (${cmds.length} commands) 💎 ${premiumCount} premium`
              : `📂 ${category} (${cmds.length} commands)`;

          // Just show command names with premium indicators
          const commandList = cmds
            .map(cmd => {
              const premiumBadge = cmd.premiumOnly ? '💎' : '';
              const ownerBadge = cmd.ownerOnly ? '👑' : '';
              return `${premiumBadge}${ownerBadge}\`${cmd.name}\``;
            })
            .join(', ');

          // Check if field value is within Discord's 1024 character limit
          if (commandList.length > 1024) {
            // Split into multiple fields if too long
            const cmdNames = cmds.map(cmd => {
              const premiumBadge = cmd.premiumOnly ? '💎' : '';
              const ownerBadge = cmd.ownerOnly ? '👑' : '';
              return `${premiumBadge}${ownerBadge}\`${cmd.name}\``;
            });
            let currentChunk = '';
            let chunkIndex = 1;

            for (const cmdName of cmdNames) {
              if ((currentChunk + cmdName).length > 1000) {
                embed.addFields({
                  name: `${categoryTitle} (${chunkIndex})`,
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
                name: `${categoryTitle} (${chunkIndex})`,
                value: currentChunk.slice(0, -2), // Remove trailing comma
                inline: false,
              });
            }
          } else {
            embed.addFields({
              name: categoryTitle,
              value: commandList || 'No commands',
              inline: false,
            });
          }
        }

        return embed;
      };

      const embed = generateEmbed(currentPage);

      // Create navigation buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('⏮️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0 || totalPages === 1),
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === 0 || totalPages === 1),
        new ButtonBuilder()
          .setCustomId('page')
          .setLabel(`${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === totalPages - 1 || totalPages === 1),
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1 || totalPages === 1)
      );

      const msg = await message.channel.send({
        embeds: [embed],
        components: totalPages > 1 ? [row] : [],
      });

      if (totalPages <= 1) return;

      // Button collector
      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 300000, // 5 minutes
      });

      collector.on('collect', async i => {
        if (i.customId === 'first') currentPage = 0;
        else if (i.customId === 'prev')
          currentPage = Math.max(0, currentPage - 1);
        else if (i.customId === 'next')
          currentPage = Math.min(totalPages - 1, currentPage + 1);
        else if (i.customId === 'last') currentPage = totalPages - 1;

        const newEmbed = generateEmbed(currentPage);
        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('first')
            .setLabel('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId('page')
            .setLabel(`${currentPage + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1),
          new ButtonBuilder()
            .setCustomId('last')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages - 1)
        );

        await i.update({ embeds: [newEmbed], components: [newRow] });
      });

      collector.on('end', () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('first')
            .setLabel('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('page')
            .setLabel(`${currentPage + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('last')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
        msg.edit({ components: [disabledRow] }).catch(() => {});
      });

      return;
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
          cmd =>
            cmd.category &&
            cmd.category.toLowerCase() === name.toLowerCase() &&
            (!cmd.ownerOnly || isOwner)
        );

        if (categoryCommands.length > 0) {
          // Count premium commands
          const premiumCount = categoryCommands.filter(
            cmd => cmd.premiumOnly
          ).length;

          // Show all commands in this category
          const embed = new EmbedBuilder()
            .setColor(isPremium ? 0xffd700 : 0x9b59b6)
            .setTitle(
              `📂 ${categoryName} Commands ${premiumCount > 0 ? `💎 ${premiumCount} premium` : ''}`
            )
            .setDescription(
              `Here are all **${categoryCommands.length}** commands in the **${categoryName}** category:\n\u200b`
            )
            .setFooter(branding.footers.default)
            .setTimestamp();

          // Add each command with its description
          categoryCommands.forEach(cmd => {
            const premiumBadge = cmd.premiumOnly ? '💎 ' : '';
            const ownerBadge = cmd.ownerOnly ? '👑 ' : '';
            embed.addFields({
              name: `${premiumBadge}${ownerBadge}${prefix}${cmd.name}`,
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

      const premiumBadge = command.premiumOnly ? '💎 ' : '';
      const ownerBadge = command.ownerOnly ? '👑 ' : '';

      const embed = new EmbedBuilder()
        .setColor(command.premiumOnly ? 0xffd700 : 0x0099ff)
        .setTitle(`📖 ${premiumBadge}${ownerBadge}${command.name}`)
        .setFooter(branding.footers.default)
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

      if (command.aliases && command.aliases.length > 0) {
        embed.addFields({
          name: '🔀 Aliases',
          value: command.aliases.map(a => `\`${a}\``).join(', '),
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

      if (command.cooldown) {
        embed.addFields({
          name: '⏱️ Cooldown',
          value: `${command.cooldown} second${command.cooldown !== 1 ? 's' : ''}`,
          inline: true,
        });
      }

      // Add premium/owner badges
      const badges = [];
      if (command.premiumOnly) badges.push('💎 Premium Only');
      if (command.ownerOnly) badges.push('👑 Owner Only');
      if (command.guildOnly) badges.push('🏠 Server Only');
      if (command.nsfw) badges.push('🔞 NSFW');

      if (badges.length > 0) {
        embed.addFields({
          name: '🏷️ Requirements',
          value: badges.join('\n'),
          inline: false,
        });
      }

      return message.channel.send({ embeds: [embed] });
    }
  },
};
