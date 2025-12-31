const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

const achievements = {
  first_command: {
    name: 'First Steps',
    desc: 'Use your first command',
    emoji: '🎯',
    reward: 100,
  },
  level_10: {
    name: 'Rising Star',
    desc: 'Reach level 10',
    emoji: '⭐',
    reward: 500,
  },
  level_50: {
    name: 'Veteran',
    desc: 'Reach level 50',
    emoji: '🏆',
    reward: 2500,
  },
  married: {
    name: 'Happily Married',
    desc: 'Get married',
    emoji: '💍',
    reward: 1000,
  },
  rich: { name: 'Wealthy', desc: 'Have 100k coins', emoji: '💰', reward: 5000 },
  pet_owner: {
    name: 'Pet Owner',
    desc: 'Adopt a pet',
    emoji: '🐾',
    reward: 500,
  },
};

module.exports = {
  name: 'achievements',
  description: 'View achievements',
  usage: '[@user]',
  aliases: ['badges'],
  category: 'economy',
  cooldown: 5,
  async execute(message) {
    const user = message.mentions.users.first() || message.author;
    const userAch = db.get('achievements', user.id) || [];

    if (user.id === message.author.id) {
      const newAch = await checkAchievements(user.id);
      if (newAch.length > 0) {
        for (const ach of newAch) {
          userAch.push(ach);
          const economy = db.get('economy', user.id) || { coins: 0, bank: 0 };
          economy.coins += achievements[ach].reward;
          db.set('economy', user.id, economy);
        }
        db.set('achievements', user.id, userAch);
      }
    }

    const list = Object.entries(achievements)
      .map(([key, ach]) => {
        const unlocked = userAch.includes(key);
        return `${unlocked ? '✅' : '🔒'} ${ach.emoji} **${ach.name}** - ${ach.desc}`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`🏆 ${user.username}'s Achievements`)
      .setDescription(list)
      .addFields({
        name: 'Progress',
        value: `${userAch.length}/${Object.keys(achievements).length}`,
        inline: true,
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

async function checkAchievements(userId) {
  const userAch = db.get('achievements', userId) || [];
  const newAch = [];

  const leveling = db.get('leveling', userId) || { level: 1 };
  if (leveling.level >= 10 && !userAch.includes('level_10'))
    newAch.push('level_10');
  if (leveling.level >= 50 && !userAch.includes('level_50'))
    newAch.push('level_50');

  const marriage = db.get('marriages', userId);
  if (marriage && !userAch.includes('married')) newAch.push('married');

  const economy = db.get('economy', userId) || { coins: 0, bank: 0 };
  if (economy.coins + economy.bank >= 100000 && !userAch.includes('rich'))
    newAch.push('rich');

  const pet = db.get('pets', userId);
  if (pet && !userAch.includes('pet_owner')) newAch.push('pet_owner');

  return newAch;
}
