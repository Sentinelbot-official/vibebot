const { PermissionFlagsBits } = require('discord.js');

/**
 * Check if a member can moderate another member
 * @param {GuildMember} moderator - The member performing the action
 * @param {GuildMember} target - The member being moderated
 * @returns {Object} { canModerate: boolean, reason: string }
 */
function canModerate(moderator, target) {
  // Can't moderate yourself
  if (moderator.id === target.id) {
    return { canModerate: false, reason: "You can't moderate yourself!" };
  }

  // Can't moderate the server owner
  if (target.id === target.guild.ownerId) {
    return {
      canModerate: false,
      reason: "You can't moderate the server owner!",
    };
  }

  // Can't moderate bots (unless you're admin)
  if (
    target.user.bot &&
    !moderator.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return { canModerate: false, reason: "You can't moderate bots!" };
  }

  // Check role hierarchy
  if (moderator.roles.highest.position <= target.roles.highest.position) {
    return {
      canModerate: false,
      reason: "You can't moderate someone with an equal or higher role!",
    };
  }

  return { canModerate: true };
}

/**
 * Check if the bot can moderate a member
 * @param {GuildMember} botMember - The bot's guild member
 * @param {GuildMember} target - The member being moderated
 * @returns {Object} { canModerate: boolean, reason: string }
 */
function botCanModerate(botMember, target) {
  // Can't moderate the server owner
  if (target.id === target.guild.ownerId) {
    return { canModerate: false, reason: "I can't moderate the server owner!" };
  }

  // Check role hierarchy
  if (botMember.roles.highest.position <= target.roles.highest.position) {
    return {
      canModerate: false,
      reason: "I can't moderate someone with an equal or higher role than me!",
    };
  }

  return { canModerate: true };
}

/**
 * Format permissions into a readable list
 * @param {Permissions} permissions - Discord permissions object
 * @returns {string[]} Array of permission names
 */
function formatPermissions(permissions) {
  const permissionNames = {
    Administrator: 'Administrator',
    ManageGuild: 'Manage Server',
    ManageRoles: 'Manage Roles',
    ManageChannels: 'Manage Channels',
    KickMembers: 'Kick Members',
    BanMembers: 'Ban Members',
    ManageMessages: 'Manage Messages',
    ModerateMembers: 'Timeout Members',
    ViewAuditLog: 'View Audit Log',
    ManageWebhooks: 'Manage Webhooks',
    ManageEmojisAndStickers: 'Manage Emojis and Stickers',
    SendMessages: 'Send Messages',
    EmbedLinks: 'Embed Links',
    AttachFiles: 'Attach Files',
    AddReactions: 'Add Reactions',
    UseExternalEmojis: 'Use External Emojis',
    MentionEveryone: 'Mention Everyone',
    ReadMessageHistory: 'Read Message History',
    Connect: 'Connect to Voice',
    Speak: 'Speak in Voice',
    MuteMembers: 'Mute Members',
    DeafenMembers: 'Deafen Members',
    MoveMembers: 'Move Members',
  };

  const perms = [];
  for (const [key, value] of Object.entries(PermissionFlagsBits)) {
    if (permissions.has(value) && permissionNames[key]) {
      perms.push(permissionNames[key]);
    }
  }

  return perms;
}

/**
 * Check if member has any of the specified permissions
 * @param {GuildMember} member - The member to check
 * @param {Array} permissions - Array of permission flags
 * @returns {boolean}
 */
function hasAnyPermission(member, permissions) {
  return permissions.some(perm => member.permissions.has(perm));
}

/**
 * Check if member has all of the specified permissions
 * @param {GuildMember} member - The member to check
 * @param {Array} permissions - Array of permission flags
 * @returns {boolean}
 */
function hasAllPermissions(member, permissions) {
  return permissions.every(perm => member.permissions.has(perm));
}

module.exports = {
  canModerate,
  botCanModerate,
  formatPermissions,
  hasAnyPermission,
  hasAllPermissions,
};
