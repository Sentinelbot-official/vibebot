const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'championship',
  aliases: ['champ', 'finals'],
  description: 'View championship history and hall of fame',
  usage: '',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const championships = db.get('championships', message.guild.id) || [];
    const userChampionships = championships.filter(
      c => c.winner === message.author.id
    );

    if (championships.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🏆 Championship Hall of Fame')
        .setDescription(
          '**No championships yet!**\n\n' +
            'Championships are awarded at the end of each season to:\n' +
            '• Tournament winners\n' +
            '• Season #1 ranked players\n' +
            '• Special event champions\n\n' +
            'Compete to be the first champion!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🏆 Championship Hall of Fame')
      .setDescription(
        `**Your Championships:** ${userChampionships.length}\n\n` +
          '**Recent Champions:**\n' +
          championships
            .slice(-10)
            .reverse()
            .map(
              (c, i) =>
                `${i + 1}. **${c.title}**\n` +
                `👑 Champion: <@${c.winner}>\n` +
                `📅 Date: <t:${Math.floor(c.date / 1000)}:D>\n` +
                `🏅 Prize: ${branding.formatNumber(c.prize)} coins`
            )
            .join('\n\n')
      )
      .addFields({
        name: '👑 Most Championships',
        value: getMostChampionships(championships),
        inline: false,
      })
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

function getMostChampionships(championships) {
  const counts = {};

  for (const champ of championships) {
    counts[champ.winner] = (counts[champ.winner] || 0) + 1;
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) return 'No data';

  return sorted
    .map(([userId, count], i) => `${i + 1}. <@${userId}> - ${count} championship${count !== 1 ? 's' : ''}`)
    .join('\n');
}
