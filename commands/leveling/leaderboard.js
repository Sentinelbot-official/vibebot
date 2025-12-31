const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'levels',
  aliases: ['lvlb', 'ranktop'],
  description: 'View the server level leaderboard',
  category: 'leveling',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const allLevels = db.all('levels');

    // Filter for this guild only
    const guildLevels = Object.entries(allLevels)
      .filter(([key]) => key.startsWith(message.guild.id))
      .map(([key, data]) => ({
        userId: key.split('-')[1],
        level: data.level,
        xp: data.xp,
        messages: data.messages,
      }))
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.xp - a.xp;
      })
      .slice(0, 10); // Top 10

    if (guildLevels.length === 0) {
      return message.reply('❌ No level data found for this server!');
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`📊 ${message.guild.name} - Level Leaderboard`)
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setTimestamp();

    let description = '';
    for (let i = 0; i < guildLevels.length; i++) {
      const user = guildLevels[i];
      const member = await message.guild.members
        .fetch(user.userId)
        .catch(() => null);
      const username = member ? member.user.tag : `User ${user.userId}`;

      const medal =
        i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      description += `${medal} **${username}** - Level ${user.level} (${user.xp} XP)\n`;
    }

    embed.setDescription(description);
    message.reply({ embeds: [embed] });
  },
};
