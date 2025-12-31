const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'reactionrole',
  aliases: ['rr'],
  description: 'Create a reaction role message',
  usage: '<emoji> <@role> <description>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Permission check
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return message.reply(
        '❌ You need Manage Roles permission to use this command!'
      );
    }

    if (args.length < 3) {
      return message.reply(
        '❌ Usage: `reactionrole <emoji> <@role> <description>`'
      );
    }

    const emoji = args[0];
    const role = message.mentions.roles.first();
    const description = args.slice(2).join(' ');

    if (!role) {
      return message.reply('❌ Please mention a valid role!');
    }

    // Get or create reaction roles for this guild
    const reactionRoles = db.get('reaction_roles', message.guild.id) || {};

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🎭 Reaction Roles')
      .setDescription('React to get your role!')
      .addFields({
        name: `${emoji} ${role.name}`,
        value: description,
        inline: false,
      })
      .setFooter({ text: 'React below to get the role!' })
      .setTimestamp();

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react(emoji).catch(() => {
      return message.reply('❌ Invalid emoji! Please use a valid emoji.');
    });

    // Store reaction role data
    if (!reactionRoles[msg.id]) {
      reactionRoles[msg.id] = {};
    }

    reactionRoles[msg.id][emoji] = {
      roleId: role.id,
      description,
      channelId: message.channel.id,
    };

    db.set('reaction_roles', message.guild.id, reactionRoles);

    message.reply('✅ Reaction role created!').then(m => {
      setTimeout(() => m.delete().catch(() => {}), 5000);
    });
    message.delete().catch(() => {});
  },
};
