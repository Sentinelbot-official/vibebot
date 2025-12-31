const db = require('../utils/database');
const { EmbedBuilder } = require('discord.js');

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
    const xpGain = Math.floor(Math.random() * 11) + 15;
    levelData.xp += xpGain;
    levelData.messages += 1;
    levelData.lastXP = now;

    // Calculate level
    const xpNeeded = levelData.level * 100;

    if (levelData.xp >= xpNeeded) {
      levelData.level += 1;
      levelData.xp = 0;

      // Level up message
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 Level Up!')
        .setDescription(
          `${message.author}, you've reached **Level ${levelData.level}**!`
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
