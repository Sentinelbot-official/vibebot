const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'milestone',
  aliases: ['milestones', 'servermilestone'],
  description: 'Track and celebrate server milestones',
  usage: '[setup/list/check]',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'list') {
      const milestones = db.get('milestones', message.guild.id) || {};
      const achieved = Object.values(milestones).filter(m => m.achieved);
      const pending = Object.values(milestones).filter(m => !m.achieved);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🏆 Server Milestones')
        .setDescription(
          `**${message.guild.name}** Progress Tracker\n\n` +
            `**Current Stats:**\n` +
            `👥 Members: ${branding.formatNumber(message.guild.memberCount)}\n` +
            `💬 Channels: ${message.guild.channels.cache.size}\n` +
            `🎭 Roles: ${message.guild.roles.cache.size}\n` +
            `📊 Emojis: ${message.guild.emojis.cache.size}`
        )
        .addFields(
          {
            name: '✅ Achieved Milestones',
            value:
              achieved.length > 0
                ? achieved
                    .map(
                      m =>
                        `${m.emoji} **${m.name}** - <t:${Math.floor(m.achievedAt / 1000)}:R>`
                    )
                    .join('\n')
                : 'None yet!',
            inline: false,
          },
          {
            name: '🎯 Upcoming Milestones',
            value:
              pending.length > 0
                ? pending
                    .map(m => {
                      const progress = this.calculateProgress(
                        m.type,
                        m.target,
                        message.guild
                      );
                      const percentage = (
                        (progress.current / progress.target) *
                        100
                      ).toFixed(1);
                      return `${m.emoji} **${m.name}** - ${progress.current}/${progress.target} (${percentage}%)`;
                    })
                    .join('\n')
                : 'All milestones achieved!',
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'setup') {
      if (
        !message.member.permissions.has(PermissionFlagsBits.ManageGuild)
      ) {
        return message.reply(
          '❌ You need **Manage Server** permission to set up milestones!'
        );
      }

      // Initialize default milestones
      const defaultMilestones = {
        members_100: {
          id: 'members_100',
          name: '100 Members',
          emoji: '🎉',
          type: 'members',
          target: 100,
          achieved: false,
        },
        members_500: {
          id: 'members_500',
          name: '500 Members',
          emoji: '🎊',
          type: 'members',
          target: 500,
          achieved: false,
        },
        members_1000: {
          id: 'members_1000',
          name: '1K Members',
          emoji: '🏆',
          type: 'members',
          target: 1000,
          achieved: false,
        },
        members_5000: {
          id: 'members_5000',
          name: '5K Members',
          emoji: '💎',
          type: 'members',
          target: 5000,
          achieved: false,
        },
        members_10000: {
          id: 'members_10000',
          name: '10K Members',
          emoji: '👑',
          type: 'members',
          target: 10000,
          achieved: false,
        },
        channels_50: {
          id: 'channels_50',
          name: '50 Channels',
          emoji: '📺',
          type: 'channels',
          target: 50,
          achieved: false,
        },
        roles_50: {
          id: 'roles_50',
          name: '50 Roles',
          emoji: '🎭',
          type: 'roles',
          target: 50,
          achieved: false,
        },
        emojis_50: {
          id: 'emojis_50',
          name: '50 Emojis',
          emoji: '😄',
          type: 'emojis',
          target: 50,
          achieved: false,
        },
      };

      db.set('milestones', message.guild.id, defaultMilestones);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Milestones Initialized!')
        .setDescription(
          '**Default milestones have been set up:**\n\n' +
            '🎉 100 Members\n' +
            '🎊 500 Members\n' +
            '🏆 1,000 Members\n' +
            '💎 5,000 Members\n' +
            '👑 10,000 Members\n' +
            '📺 50 Channels\n' +
            '🎭 50 Roles\n' +
            '😄 50 Emojis\n\n' +
            'Use `//milestone check` to check progress!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'check') {
      const milestones = db.get('milestones', message.guild.id) || {};
      let newAchievements = [];

      for (const milestone of Object.values(milestones)) {
        if (milestone.achieved) continue;

        const progress = this.calculateProgress(
          milestone.type,
          milestone.target,
          message.guild
        );

        if (progress.current >= progress.target) {
          milestone.achieved = true;
          milestone.achievedAt = Date.now();
          newAchievements.push(milestone);
        }
      }

      if (newAchievements.length > 0) {
        db.set('milestones', message.guild.id, milestones);

        const embed = new EmbedBuilder()
          .setColor(branding.colors.success)
          .setTitle('🎉 NEW MILESTONE ACHIEVED!')
          .setDescription(
            newAchievements
              .map(
                m =>
                  `${m.emoji} **${m.name}**\n` +
                  `Congratulations ${message.guild.name}! 🎊`
              )
              .join('\n\n')
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } else {
        return message.reply('📊 No new milestones achieved yet. Keep growing!');
      }
    }
  },

  calculateProgress(type, target, guild) {
    let current = 0;

    switch (type) {
      case 'members':
        current = guild.memberCount;
        break;
      case 'channels':
        current = guild.channels.cache.size;
        break;
      case 'roles':
        current = guild.roles.cache.size;
        break;
      case 'emojis':
        current = guild.emojis.cache.size;
        break;
    }

    return { current, target };
  },
};
