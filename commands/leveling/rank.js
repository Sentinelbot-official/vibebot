const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'rank',
  aliases: ['level', 'xp'],
  description: 'Check your rank and XP',
  usage: '[@user]',
  category: 'leveling',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const key = `${message.guild.id}-${user.id}`;

    // Get user level data
    const levelData = db.get('levels', key) || {
      xp: 0,
      level: 1,
      messages: 0,
    };

    const xpNeeded = levelData.level * 100;
    const progress = Math.floor((levelData.xp / xpNeeded) * 100);

    // Calculate rank
    const allLevels = db.all('levels');
    const guildLevels = Object.entries(allLevels)
      .filter(([k]) => k.startsWith(message.guild.id))
      .map(([k, v]) => ({
        userId: k.split('-')[1],
        level: v.level,
        xp: v.xp,
      }))
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      });

    const rank = guildLevels.findIndex(u => u.userId === user.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setAuthor({
        name: `${user.username}'s Rank`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📊 Level', value: `${levelData.level}`, inline: true },
        { name: '⭐ XP', value: `${levelData.xp}/${xpNeeded}`, inline: true },
        { name: '🏆 Rank', value: `#${rank}`, inline: true },
        { name: '💬 Messages', value: `${levelData.messages}`, inline: true },
        {
          name: '📈 Progress',
          value: `${'█'.repeat(Math.floor(progress / 10))}${'░'.repeat(10 - Math.floor(progress / 10))} ${progress}%`,
          inline: false,
        }
      )
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
