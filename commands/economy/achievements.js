const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

const achievements = {
  // Starter achievements
  first_command: {
    name: 'First Steps',
    desc: 'Use your first command',
    emoji: '🎯',
    reward: 100,
    category: 'starter',
  },
  daily_streak_7: {
    name: 'Week Warrior',
    desc: 'Claim daily reward 7 days in a row',
    emoji: '📅',
    reward: 500,
    category: 'starter',
  },
  first_purchase: {
    name: 'First Purchase',
    desc: 'Buy your first item from the shop',
    emoji: '🛒',
    reward: 250,
    category: 'starter',
  },

  // Leveling achievements
  level_10: {
    name: 'Rising Star',
    desc: 'Reach level 10',
    emoji: '⭐',
    reward: 500,
    category: 'leveling',
  },
  level_25: {
    name: 'Experienced',
    desc: 'Reach level 25',
    emoji: '🌟',
    reward: 1000,
    category: 'leveling',
  },
  level_50: {
    name: 'Veteran',
    desc: 'Reach level 50',
    emoji: '🏆',
    reward: 2500,
    category: 'leveling',
  },
  level_100: {
    name: 'Legend',
    desc: 'Reach level 100',
    emoji: '👑',
    reward: 10000,
    category: 'leveling',
  },

  // Economy achievements
  rich: {
    name: 'Wealthy',
    desc: 'Have 100k coins',
    emoji: '💰',
    reward: 5000,
    category: 'economy',
  },
  millionaire: {
    name: 'Millionaire',
    desc: 'Have 1 million coins',
    emoji: '💎',
    reward: 50000,
    category: 'economy',
  },
  daily_streak_30: {
    name: 'Monthly Master',
    desc: 'Claim daily reward 30 days in a row',
    emoji: '🔥',
    reward: 2500,
    category: 'economy',
  },
  daily_streak_100: {
    name: 'Century Collector',
    desc: 'Claim daily reward 100 days in a row',
    emoji: '💯',
    reward: 10000,
    category: 'economy',
  },
  gambler: {
    name: 'High Roller',
    desc: 'Win 100k coins from gambling',
    emoji: '🎰',
    reward: 5000,
    category: 'economy',
  },
  trader: {
    name: 'Master Trader',
    desc: 'Complete 50 trades',
    emoji: '🤝',
    reward: 3000,
    category: 'economy',
  },

  // Social achievements
  married: {
    name: 'Happily Married',
    desc: 'Get married',
    emoji: '💍',
    reward: 1000,
    category: 'social',
  },
  popular: {
    name: 'Popular',
    desc: 'Receive 100 reputation points',
    emoji: '⭐',
    reward: 2000,
    category: 'social',
  },
  social_butterfly: {
    name: 'Social Butterfly',
    desc: 'Send 1000 messages',
    emoji: '🦋',
    reward: 1500,
    category: 'social',
  },

  // Activity achievements
  pet_owner: {
    name: 'Pet Owner',
    desc: 'Adopt a pet',
    emoji: '🐾',
    reward: 500,
    category: 'activity',
  },
  voice_active: {
    name: 'Voice Champion',
    desc: 'Spend 24 hours in voice channels',
    emoji: '🎤',
    reward: 2000,
    category: 'activity',
  },
  early_bird: {
    name: 'Early Bird',
    desc: 'Be active before 6 AM',
    emoji: '🌅',
    reward: 500,
    category: 'activity',
  },
  night_owl: {
    name: 'Night Owl',
    desc: 'Be active after midnight',
    emoji: '🦉',
    reward: 500,
    category: 'activity',
  },

  // Special achievements
  birthday: {
    name: 'Birthday Star',
    desc: 'Be active on your birthday',
    emoji: '🎂',
    reward: 5000,
    category: 'special',
  },
  premium: {
    name: 'Premium Member',
    desc: 'Activate premium',
    emoji: '💎',
    reward: 10000,
    category: 'special',
  },
  bug_hunter: {
    name: 'Bug Hunter',
    desc: 'Report a valid bug',
    emoji: '🐛',
    reward: 5000,
    category: 'special',
  },
  supporter: {
    name: 'Supporter',
    desc: 'Boost the server',
    emoji: '💜',
    reward: 10000,
    category: 'special',
  },
};

module.exports = {
  name: 'achievements',
  description: 'View achievements',
  usage: '[@user]',
  aliases: ['badges'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const userAch = db.get('achievements', user.id) || [];

    // Check for new achievements if viewing own profile
    if (user.id === message.author.id) {
      const newAch = await checkAchievements(user.id, message);
      if (newAch.length > 0) {
        let totalReward = 0;
        for (const ach of newAch) {
          userAch.push(ach);
          totalReward += achievements[ach].reward;
        }
        
        const economy = db.get('economy', user.id) || { coins: 0, bank: 0 };
        economy.coins += totalReward;
        db.set('economy', user.id, economy);
        db.set('achievements', user.id, userAch);

        // Notify about new achievements
        const newAchList = newAch
          .map(key => `${achievements[key].emoji} **${achievements[key].name}** (+${achievements[key].reward} coins)`)
          .join('\n');
        
        await message.channel.send(
          `🎉 **${user.username}** unlocked ${newAch.length} new achievement${newAch.length > 1 ? 's' : ''}!\n\n${newAchList}\n\n💰 Total reward: **${totalReward} coins**`
        );
      }
    }

    // Category filter
    const filter = args[0]?.toLowerCase();
    const validFilters = ['starter', 'leveling', 'economy', 'social', 'activity', 'special', 'all'];
    const selectedFilter = validFilters.includes(filter) ? filter : 'all';

    // Filter achievements by category
    const filteredAchievements = Object.entries(achievements).filter(([key, ach]) => 
      selectedFilter === 'all' || ach.category === selectedFilter
    );

    // Group by category
    const categories = {
      starter: [],
      leveling: [],
      economy: [],
      social: [],
      activity: [],
      special: [],
    };

    for (const [key, ach] of filteredAchievements) {
      const unlocked = userAch.includes(key);
      const status = unlocked ? '✅' : '🔒';
      categories[ach.category].push(
        `${status} ${ach.emoji} **${ach.name}** - ${ach.desc} (+${ach.reward} coins)`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`🏆 ${user.username}'s Achievements`)
      .setDescription(
        `**Filter:** ${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}\n` +
        `**Progress:** ${userAch.length}/${Object.keys(achievements).length} (${Math.round((userAch.length / Object.keys(achievements).length) * 100)}%)\n\u200b`
      )
      .setThumbnail(user.displayAvatarURL());

    // Add category fields
    for (const [category, achList] of Object.entries(categories)) {
      if (achList.length > 0 && (selectedFilter === 'all' || selectedFilter === category)) {
        const categoryName = {
          starter: '🎯 Starter',
          leveling: '⭐ Leveling',
          economy: '💰 Economy',
          social: '💬 Social',
          activity: '🎮 Activity',
          special: '✨ Special',
        }[category];

        embed.addFields({
          name: categoryName,
          value: achList.join('\n'),
          inline: false,
        });
      }
    }

    // Calculate total rewards earned
    const totalRewards = userAch.reduce((sum, key) => sum + (achievements[key]?.reward || 0), 0);

    embed.addFields({
      name: '📊 Statistics',
      value: 
        `**Unlocked:** ${userAch.length}/${Object.keys(achievements).length}\n` +
        `**Total Rewards:** ${totalRewards.toLocaleString()} coins\n` +
        `**Completion:** ${Math.round((userAch.length / Object.keys(achievements).length) * 100)}%`,
      inline: true,
    });

    // Show rarest achievement
    if (userAch.length > 0) {
      // Find rarest achievement (highest reward = rarest)
      const rarestKey = userAch.reduce((rarest, key) => {
        return achievements[key].reward > achievements[rarest].reward ? key : rarest;
      });
      const rarest = achievements[rarestKey];

      embed.addFields({
        name: '🌟 Rarest Achievement',
        value: `${rarest.emoji} **${rarest.name}**\n${rarest.desc}`,
        inline: true,
      });
    }

    embed.setFooter({
      text: `Use //achievements [starter|leveling|economy|social|activity|special] to filter`,
    });
    embed.setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

async function checkAchievements(userId, message) {
  const userAch = db.get('achievements', userId) || [];
  const newAch = [];

  // Leveling achievements
  const leveling = db.get('leveling', userId) || { level: 1, messages: 0 };
  if (leveling.level >= 10 && !userAch.includes('level_10'))
    newAch.push('level_10');
  if (leveling.level >= 25 && !userAch.includes('level_25'))
    newAch.push('level_25');
  if (leveling.level >= 50 && !userAch.includes('level_50'))
    newAch.push('level_50');
  if (leveling.level >= 100 && !userAch.includes('level_100'))
    newAch.push('level_100');

  // Economy achievements
  const economy = db.get('economy', userId) || {
    coins: 0,
    bank: 0,
    dailyStreak: 0,
    totalEarned: 0,
    gamblingWins: 0,
    trades: 0,
  };

  const netWorth = economy.coins + economy.bank;
  if (netWorth >= 100000 && !userAch.includes('rich')) newAch.push('rich');
  if (netWorth >= 1000000 && !userAch.includes('millionaire'))
    newAch.push('millionaire');

  if (economy.dailyStreak >= 7 && !userAch.includes('daily_streak_7'))
    newAch.push('daily_streak_7');
  if (economy.dailyStreak >= 30 && !userAch.includes('daily_streak_30'))
    newAch.push('daily_streak_30');
  if (economy.dailyStreak >= 100 && !userAch.includes('daily_streak_100'))
    newAch.push('daily_streak_100');

  if (economy.gamblingWins >= 100000 && !userAch.includes('gambler'))
    newAch.push('gambler');
  if (economy.trades >= 50 && !userAch.includes('trader'))
    newAch.push('trader');

  // Social achievements
  const marriage = db.get('marriages', userId);
  if (marriage && !userAch.includes('married')) newAch.push('married');

  const reputation = db.get('reputation', userId) || { points: 0 };
  if (reputation.points >= 100 && !userAch.includes('popular'))
    newAch.push('popular');

  if (leveling.messages >= 1000 && !userAch.includes('social_butterfly'))
    newAch.push('social_butterfly');

  // Activity achievements
  const pet = db.get('pets', userId);
  if (pet && !userAch.includes('pet_owner')) newAch.push('pet_owner');

  const voiceTime = db.get('voice_time', userId) || { total: 0 };
  if (voiceTime.total >= 24 * 60 * 60 * 1000 && !userAch.includes('voice_active'))
    newAch.push('voice_active');

  // Time-based achievements
  const now = new Date();
  const hour = now.getHours();
  if (hour < 6 && !userAch.includes('early_bird')) newAch.push('early_bird');
  if (hour >= 0 && hour < 4 && !userAch.includes('night_owl'))
    newAch.push('night_owl');

  // Special achievements
  const premium = db.get('premium_users', userId);
  if (premium && !userAch.includes('premium')) newAch.push('premium');

  // Check if user has boosted the server
  if (message && message.member) {
    if (message.member.premiumSince && !userAch.includes('supporter')) {
      newAch.push('supporter');
    }
  }

  // Starter achievements
  const inventory = db.get('inventory', userId);
  if (inventory && inventory.length > 0 && !userAch.includes('first_purchase'))
    newAch.push('first_purchase');

  return newAch;
}
