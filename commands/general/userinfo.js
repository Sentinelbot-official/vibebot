const { EmbedBuilder } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'userinfo',
  description: 'Get advanced information about a user',
  usage: '[@user | userID]',
  aliases: ['user', 'whois', 'profile'],
  category: 'general',
  cooldown: 3,
  async execute(message, args) {
    let user;
    let member;

    try {
      // Check for mention first
      if (message.mentions.users.first()) {
        user = message.mentions.users.first();
      }
      // Check for user ID in args
      else if (args[0]) {
        user = await message.client.users.fetch(args[0]).catch(() => null);
      }
      // Default to message author
      else {
        user = message.author;
      }

      if (!user) {
        return message.reply('❌ Could not find that user!');
      }

      // Try to get member info if they're in the server
      member = message.guild.members.cache.get(user.id);

      // Get premium profile customization
      const premiumProfile = db.get('premium_profiles', user.id) || {
        theme: 'default',
        badge: null,
        bio: null,
      };

      // Get economy data
      const economy = db.get('economy', user.id) || { coins: 0, bank: 0 };
      const totalWealth = economy.coins + economy.bank;

      // Get level data
      const levelKey = `${message.guild.id}-${user.id}`;
      const levelData = db.get('levels', levelKey) || {
        level: 1,
        xp: 0,
        messages: 0,
      };

      // Get premium tier
      const tierBadge = premiumPerks.getTierBadge(message.guild.id);
      const tierName = premiumPerks.getTierDisplayName(message.guild.id);

      // Avatar and banner
      const avatar = user.displayAvatarURL({ dynamic: true, size: 512 });
      const banner = user.bannerURL({ size: 1024 });

      // Account age
      const accountAge = Math.floor(
        (Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24)
      );
      const accountYears = (accountAge / 365).toFixed(1);

      // Badges
      const badges = [];
      const flags = user.flags?.toArray() || [];
      const badgeEmojis = {
        Staff: '👨‍💼',
        Partner: '🤝',
        Hypesquad: '🎉',
        BugHunterLevel1: '🐛',
        BugHunterLevel2: '🐛🐛',
        HypeSquadOnlineHouse1: '💜', // Bravery
        HypeSquadOnlineHouse2: '💛', // Brilliance
        HypeSquadOnlineHouse3: '💚', // Balance
        PremiumEarlySupporter: '⏰',
        VerifiedDeveloper: '✅',
        CertifiedModerator: '🛡️',
        ActiveDeveloper: '🔨',
      };

      flags.forEach(flag => {
        if (badgeEmojis[flag]) {
          badges.push(badgeEmojis[flag]);
        }
      });

      // Bot badge
      if (user.bot) badges.unshift('🤖');

      const embed = new EmbedBuilder()
        .setColor(member?.displayHexColor || 0x0099ff)
        .setTitle(`${badges.join(' ')} ${user.username}'s Profile`)
        .setThumbnail(avatar)
        .setDescription(
          premiumProfile.bio
            ? `*${premiumProfile.bio}*\n\n${premiumProfile.badge ? `**${premiumProfile.badge}**\n` : ''}`
            : null
        );

      // User information
      embed.addFields({
        name: '👤 User Information',
        value:
          `**Username:** ${user.tag}\n` +
          `**Display Name:** ${user.displayName || user.username}\n` +
          `**User ID:** ${user.id}\n` +
          `**Bot:** ${user.bot ? 'Yes 🤖' : 'No'}\n` +
          `**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n` +
          `**Account Age:** ${accountAge.toLocaleString()} days (${accountYears} years)`,
        inline: false,
      });

      // Server-specific info if member exists
      if (member) {
        const joinedDays = Math.floor(
          (Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24)
        );
        const joinPosition =
          message.guild.members.cache
            .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
            .map(m => m.id)
            .indexOf(member.id) + 1;

        embed.addFields({
          name: '📥 Server Information',
          value:
            `**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n` +
            `**Join Age:** ${joinedDays.toLocaleString()} days\n` +
            `**Join Position:** #${joinPosition.toLocaleString()} of ${message.guild.memberCount.toLocaleString()}\n` +
            `**Nickname:** ${member.nickname || 'None'}\n` +
            `**Boosting:** ${member.premiumSince ? `Yes (since <t:${Math.floor(member.premiumSince.getTime() / 1000)}:R>)` : 'No'}`,
          inline: false,
        });

        // Roles
        const roles = member.roles.cache
          .filter(role => role.name !== '@everyone')
          .sort((a, b) => b.position - a.position)
          .map(role => role.toString())
          .slice(0, 10);

        if (roles.length > 0) {
          embed.addFields({
            name: `🎨 Roles [${member.roles.cache.size - 1}]`,
            value:
              roles.join(', ') + (member.roles.cache.size > 11 ? '...' : ''),
            inline: false,
          });
        }

        // Key permissions
        const keyPermissions = [];
        if (member.permissions.has('Administrator'))
          keyPermissions.push('👑 Administrator');
        if (member.permissions.has('ManageGuild'))
          keyPermissions.push('⚙️ Manage Server');
        if (member.permissions.has('ManageRoles'))
          keyPermissions.push('🎭 Manage Roles');
        if (member.permissions.has('ManageChannels'))
          keyPermissions.push('📺 Manage Channels');
        if (member.permissions.has('KickMembers'))
          keyPermissions.push('👢 Kick Members');
        if (member.permissions.has('BanMembers'))
          keyPermissions.push('🔨 Ban Members');
        if (member.permissions.has('ModerateMembers'))
          keyPermissions.push('🛡️ Moderate Members');

        if (keyPermissions.length > 0) {
          embed.addFields({
            name: '🔑 Key Permissions',
            value: keyPermissions.join(', '),
            inline: false,
          });
        }

        // Status and activities
        if (member.presence) {
          const statusEmojis = {
            online: '🟢 Online',
            idle: '🟡 Idle',
            dnd: '🔴 Do Not Disturb',
            offline: '⚫ Offline',
          };
          const status = statusEmojis[member.presence.status] || '⚫ Offline';

          let presenceInfo = `**Status:** ${status}\n`;

          // Client status
          if (member.presence.clientStatus) {
            const clients = [];
            if (member.presence.clientStatus.desktop)
              clients.push('💻 Desktop');
            if (member.presence.clientStatus.mobile) clients.push('📱 Mobile');
            if (member.presence.clientStatus.web) clients.push('🌐 Web');
            if (clients.length > 0) {
              presenceInfo += `**Devices:** ${clients.join(', ')}\n`;
            }
          }

          // Activities
          if (member.presence.activities.length > 0) {
            const activities = member.presence.activities
              .map(activity => {
                const typeEmojis = {
                  0: '🎮', // Playing
                  1: '📡', // Streaming
                  2: '🎵', // Listening
                  3: '📺', // Watching
                  5: '🏆', // Competing
                };
                return `${typeEmojis[activity.type] || '✨'} ${activity.name}`;
              })
              .join('\n');
            presenceInfo += `**Activities:**\n${activities}`;
          }

          embed.addFields({
            name: '📡 Presence',
            value: presenceInfo,
            inline: true,
          });
        }
      } else {
        embed.addFields({
          name: '⚠️ Server Status',
          value: 'Not in this server',
          inline: false,
        });
      }

      // Bot statistics (economy, leveling, etc)
      embed.addFields(
        {
          name: '💰 Economy',
          value:
            `**Wallet:** ${economy.coins.toLocaleString()} coins\n` +
            `**Bank:** ${economy.bank.toLocaleString()} coins\n` +
            `**Total:** ${totalWealth.toLocaleString()} coins`,
          inline: true,
        },
        {
          name: '⭐ Leveling',
          value:
            `**Level:** ${levelData.level}\n` +
            `**XP:** ${levelData.xp.toLocaleString()}\n` +
            `**Messages:** ${levelData.messages.toLocaleString()}`,
          inline: true,
        }
      );

      // Premium info
      if (
        premiumProfile.theme !== 'default' ||
        premiumProfile.badge ||
        premiumProfile.bio
      ) {
        embed.addFields({
          name: '💎 Premium Profile',
          value:
            `**Theme:** ${premiumProfile.theme}\n` +
            `**Custom Badge:** ${premiumProfile.badge || 'None'}\n` +
            `**Server Tier:** ${tierBadge} ${tierName}`,
          inline: true,
        });
      }

      // Add banner if exists
      if (banner) {
        embed.setImage(banner);
      }

      embed.setFooter({
        text: `Requested by ${message.author.tag} | ID: ${user.id}`,
      });
      embed.setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in userinfo command:', error);
      message.reply('❌ An error occurred while fetching user information!');
    }
  },
};
