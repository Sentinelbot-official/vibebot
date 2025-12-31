const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'roleall',
  description: 'Add or remove a role from all members',
  usage: '<add|remove> <@role>',
  aliases: ['massrole', 'roleeveryone'],
  category: 'utility',
  cooldown: 60,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return message.reply('❌ You need Manage Roles permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageRoles
      )
    ) {
      return message.reply('❌ I need Manage Roles permission!');
    }

    if (args.length < 2) {
      return message.reply('❌ Usage: `roleall <add|remove> <@role>`');
    }

    const action = args[0].toLowerCase();
    if (!['add', 'remove'].includes(action)) {
      return message.reply('❌ Action must be either `add` or `remove`!');
    }

    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

    if (!role) {
      return message.reply('❌ Please provide a valid role!');
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply('❌ I cannot manage this role (role hierarchy)!');
    }

    if (role.position >= message.member.roles.highest.position) {
      return message.reply('❌ You cannot manage this role (role hierarchy)!');
    }

    // Confirmation
    const confirmMsg = await message.reply(
      `⚠️ **WARNING:** This will ${action} the role ${role} ${action === 'add' ? 'to' : 'from'} **ALL** members!\n` +
        'This may take a while and cannot be undone easily.\n\n' +
        'React with ✅ to confirm or ❌ to cancel.'
    );

    await confirmMsg.react('✅');
    await confirmMsg.react('❌');

    const filter = (reaction, user) => {
      return (
        ['✅', '❌'].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

    const collector = confirmMsg.createReactionCollector({
      filter,
      max: 1,
      time: 30000,
    });

    collector.on('collect', async reaction => {
      if (reaction.emoji.name === '❌') {
        return confirmMsg.edit('❌ Operation cancelled.');
      }

      await confirmMsg.edit(
        `⏳ ${action === 'add' ? 'Adding' : 'Removing'} role...`
      );

      const members = await message.guild.members.fetch();
      let success = 0;
      let failed = 0;
      let skipped = 0;

      for (const [_id, member] of members) {
        // Skip bots
        if (member.user.bot) {
          skipped++;
          continue;
        }

        try {
          if (action === 'add') {
            if (!member.roles.cache.has(role.id)) {
              await member.roles.add(role);
              success++;
            } else {
              skipped++;
            }
          } else {
            if (member.roles.cache.has(role.id)) {
              await member.roles.remove(role);
              success++;
            } else {
              skipped++;
            }
          }

          // Rate limit protection
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(
            `Failed to ${action} role for ${member.user.tag}:`,
            error
          );
          failed++;
        }
      }

      confirmMsg.edit(
        `✅ Role ${action} complete!\n` +
          `**Success:** ${success}\n` +
          `**Failed:** ${failed}\n` +
          `**Skipped:** ${skipped}`
      );
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        confirmMsg.edit('❌ Operation timed out.');
      }
    });
  },
};
