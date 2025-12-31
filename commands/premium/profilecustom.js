const { EmbedBuilder } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');

const PROFILE_THEMES = {
  default: { color: '#0099ff', emoji: '⚪' },
  fire: { color: '#ff4500', emoji: '🔥' },
  ocean: { color: '#1e90ff', emoji: '🌊' },
  forest: { color: '#228b22', emoji: '🌲' },
  sunset: { color: '#ff6347', emoji: '🌅' },
  galaxy: { color: '#9370db', emoji: '🌌' },
  gold: { color: '#ffd700', emoji: '👑' },
  ruby: { color: '#e0115f', emoji: '💎' },
};

module.exports = {
  name: 'profilecustom',
  description: 'Customize your profile (Premium only)',
  usage: '//profilecustom <theme/badge/bio> [value]',
  aliases: ['customprofile', 'profiletheme'],
  category: 'premium',
  cooldown: 10,
  async execute(message, args) {
    const guildId = message.guild.id;
    const hasPremium = premiumPerks.hasFeature(guildId, 'premium_badge');

    if (!hasPremium) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Premium Required')
        .setDescription(
          'Profile customization is a **Premium** feature!\n\n' +
            '**Premium Benefits:**\n' +
            '• Custom profile themes\n' +
            '• Premium badges\n' +
            '• Custom bio\n' +
            '• Enhanced profiles\n' +
            '• All Premium features\n\n' +
            'Use `//premium` to upgrade!'
        )
        .setFooter({ text: 'Support the 24/7 live coding journey! 💜' });

      return message.reply({ embeds: [embed] });
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['theme', 'badge', 'bio', 'view'].includes(action)) {
      const profile = db.get('premium_profiles', message.author.id) || {
        theme: 'default',
        badge: null,
        bio: null,
      };

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎨 Profile Customization')
        .setDescription(
          '**Customize your profile!**\n\n' +
            '**Commands:**\n' +
            '`//profilecustom theme <name>` - Set profile theme\n' +
            '`//profilecustom badge <text>` - Set custom badge\n' +
            '`//profilecustom bio <text>` - Set custom bio\n' +
            '`//profilecustom view` - View your profile\n\n' +
            '**Available Themes:**\n' +
            Object.entries(PROFILE_THEMES)
              .map(([name, data]) => `${data.emoji} \`${name}\``)
              .join(' • ') +
            '\n\n' +
            `**Current Theme:** ${PROFILE_THEMES[profile.theme].emoji} ${profile.theme}`
        )
        .setFooter({ text: '💎 Premium Feature' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'theme') {
      const themeName = args[1]?.toLowerCase();

      if (!themeName || !PROFILE_THEMES[themeName]) {
        return message.reply(
          `❌ Invalid theme! Available themes:\n${Object.keys(PROFILE_THEMES).join(', ')}`
        );
      }

      const profile = db.get('premium_profiles', message.author.id) || {};
      profile.theme = themeName;
      db.set('premium_profiles', message.author.id, profile);

      const theme = PROFILE_THEMES[themeName];

      const embed = new EmbedBuilder()
        .setColor(theme.color)
        .setTitle(`${theme.emoji} Theme Updated!`)
        .setDescription(
          `Your profile theme has been set to **${themeName}**!\n\n` +
            'Use `//profile` to see your updated profile!'
        )
        .setFooter({ text: '💎 Premium Feature' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'badge') {
      const badgeText = args.slice(1).join(' ');

      if (!badgeText) {
        const profile = db.get('premium_profiles', message.author.id) || {};
        profile.badge = null;
        db.set('premium_profiles', message.author.id, profile);

        return message.reply('✅ Custom badge removed!');
      }

      if (badgeText.length > 20) {
        return message.reply('❌ Badge text must be 20 characters or less!');
      }

      const profile = db.get('premium_profiles', message.author.id) || {};
      profile.badge = badgeText;
      db.set('premium_profiles', message.author.id, profile);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Badge Updated!')
        .setDescription(
          `Your custom badge: **${badgeText}**\n\n` +
            'Use `//profile` to see your updated profile!'
        )
        .setFooter({ text: '💎 Premium Feature' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'bio') {
      const bioText = args.slice(1).join(' ');

      if (!bioText) {
        const profile = db.get('premium_profiles', message.author.id) || {};
        profile.bio = null;
        db.set('premium_profiles', message.author.id, profile);

        return message.reply('✅ Custom bio removed!');
      }

      if (bioText.length > 200) {
        return message.reply('❌ Bio must be 200 characters or less!');
      }

      const profile = db.get('premium_profiles', message.author.id) || {};
      profile.bio = bioText;
      db.set('premium_profiles', message.author.id, profile);

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Bio Updated!')
        .setDescription(
          `**Your Bio:**\n${bioText}\n\n` +
            'Use `//profile` to see your updated profile!'
        )
        .setFooter({ text: '💎 Premium Feature' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'view') {
      const profile = db.get('premium_profiles', message.author.id) || {
        theme: 'default',
        badge: null,
        bio: null,
      };

      const theme = PROFILE_THEMES[profile.theme];
      const tierBadge = premiumPerks.getTierBadge(guildId);
      const tierName = premiumPerks.getTierDisplayName(guildId);

      // Get user stats
      const economy = db.get('economy', message.author.id) || { coins: 0, bank: 0 };
      const levelData = db.get('levels', `${guildId}-${message.author.id}`) || {
        level: 1,
        xp: 0,
      };

      const embed = new EmbedBuilder()
        .setColor(theme.color)
        .setTitle(`${theme.emoji} ${message.author.username}'s Profile`)
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(
          `${tierBadge} **${tierName} Member**\n` +
            (profile.badge ? `**${profile.badge}**\n\n` : '\n') +
            (profile.bio ? `*${profile.bio}*\n\n` : '')
        )
        .addFields(
          {
            name: '💰 Economy',
            value: `**Coins:** ${economy.coins.toLocaleString()}\n**Bank:** ${economy.bank.toLocaleString()}`,
            inline: true,
          },
          {
            name: '⭐ Level',
            value: `**Level:** ${levelData.level}\n**XP:** ${levelData.xp}`,
            inline: true,
          },
          {
            name: '🎨 Theme',
            value: `${theme.emoji} ${profile.theme}`,
            inline: true,
          }
        )
        .setFooter({ text: '💎 Premium Profile | Customized' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
