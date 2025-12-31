const db = require('../utils/database');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    // Ignore bot reactions
    if (user.bot) return;

    // Fetch partial messages
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        return;
      }
    }

    const guildId = reaction.message.guild?.id;
    if (!guildId) return;

    // Get reaction roles for this guild
    const reactionRoles = db.get('reaction_roles', guildId);
    if (!reactionRoles) return;

    // Check if this message has reaction roles
    const messageRoles = reactionRoles[reaction.message.id];
    if (!messageRoles) return;

    // Get the emoji identifier
    const emoji = reaction.emoji.id || reaction.emoji.name;

    // Check if this emoji has a role
    const roleData = messageRoles[emoji];
    if (!roleData) return;

    // Add role to user
    const member = await reaction.message.guild.members
      .fetch(user.id)
      .catch(() => null);
    if (!member) return;

    const role = reaction.message.guild.roles.cache.get(roleData.roleId);
    if (!role) return;

    await member.roles.add(role).catch(() => {});
  },
};
