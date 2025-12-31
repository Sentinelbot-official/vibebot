const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  description: 'View the richest users',
  category: 'economy',
  cooldown: 5,
  guildOnly: true,
  async execute(message, _args) {
    const allEconomy = db.all('economy');

    if (!allEconomy || Object.keys(allEconomy).length === 0) {
      return message.reply('❌ No economy data found!');
    }

    // Convert to array and calculate total wealth
    const users = Object.entries(allEconomy)
      .map(([userId, data]) => ({
        userId,
        total: data.coins + data.bank,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('💰 Wealth Leaderboard')
      .setDescription('Top 10 richest users')
      .setTimestamp();

    let description = '';
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const member = await message.guild.members
        .fetch(user.userId)
        .catch(() => null);
      const username = member ? member.user.tag : `User ${user.userId}`;

      const medal =
        i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      description += `${medal} **${username}** - ${user.total.toLocaleString()} coins\n`;
    }

    embed.setDescription(description);
    message.reply({ embeds: [embed] });
  },
};
