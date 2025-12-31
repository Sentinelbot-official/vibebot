const db = require('../utils/database');
const { EmbedBuilder } = require('discord.js');
const premiumPerks = require('../utils/premiumPerks');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${userId}`;

    // Get user level data
    const levelData = db.get('levels', key) || {
      xp: 0,
      level: 1,
      messages: 0,
      lastXP: 0,
    };

    // XP cooldown (1 minute)
    const now = Date.now();
    if (now - levelData.lastXP < 60000) return;

    // Random XP gain (15-25 per message)
    let xpGain = Math.floor(Math.random() * 11) + 15;

    // Apply premium XP multiplier
    const baseXP = xpGain;
    xpGain = premiumPerks.applyXPMultiplier(guildId, xpGain);
    const bonusXP = xpGain - baseXP;

    levelData.xp += xpGain;
    levelData.messages += 1;
    levelData.lastXP = now;

    // Calculate level
    const xpNeeded = levelData.level * 100;

    if (levelData.xp >= xpNeeded) {
      levelData.level += 1;
      levelData.xp = 0;

      // Level up message
      const tierBadge = premiumPerks.getTierBadge(guildId);
      const tierName = premiumPerks.getTierDisplayName(guildId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`${tierBadge} Level Up!`)
        .setDescription(
          `${message.author}, you've reached **Level ${levelData.level}**!${
            bonusXP > 0
              ? `\n\n${tierBadge} **${tierName} Bonus:** +${bonusXP} XP per message`
              : ''
          }`
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();

      message.channel.send({ embeds: [embed] }).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 10000);
      });

      // Check for role rewards
      const settings = db.get('guild_settings', guildId) || {};
      if (settings.levelRoles) {
        const roleReward = settings.levelRoles[levelData.level];
        if (roleReward) {
          const role = message.guild.roles.cache.get(roleReward);
          if (role) {
            message.member.roles.add(role).catch(() => {});
          }
        }
      }
    }

    db.set('levels', key, levelData);
  },
};
