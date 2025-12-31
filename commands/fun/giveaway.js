const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');

module.exports = {
  name: 'giveaway',
  description: 'Create and manage giveaways (Premium users get bonus entries!)',
  usage: '//giveaway <start/end/reroll> [duration] [winners] [prize]',
  aliases: ['gstart', 'gend'],
  category: 'fun',
  cooldown: 10,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['start', 'end', 'reroll', 'list'].includes(action)) {
      const hasPremium = premiumPerks.hasFeature(
        message.guild.id,
        'premium_badge'
      );
      const tierBadge = premiumPerks.getTierBadge(message.guild.id);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎉 Giveaway System')
        .setDescription(
          '**Host amazing giveaways in your server!**\n\n' +
            '**Commands:**\n' +
            '`//giveaway start <duration> <winners> <prize>` - Start a giveaway\n' +
            '`//giveaway end <messageId>` - End a giveaway early\n' +
            '`//giveaway reroll <messageId>` - Reroll winners\n' +
            '`//giveaway list` - List active giveaways\n\n' +
            '**Duration Examples:**\n' +
            '• `10m` - 10 minutes\n' +
            '• `1h` - 1 hour\n' +
            '• `1d` - 1 day\n' +
            '• `7d` - 7 days\n\n' +
            '**Example:**\n' +
            '`//giveaway start 1d 1 Nitro Classic`\n\n' +
            `${tierBadge} **Premium Perks:**\n` +
            `${hasPremium ? '✅' : '❌'} Premium: 2x entries\n` +
            `${hasPremium ? '✅' : '❌'} VIP: 3x entries`
        )
        .setFooter({
          text: hasPremium
            ? 'Premium Feature Active 💎'
            : 'Upgrade to Premium for bonus entries!',
        });

      return message.reply({ embeds: [embed] });
    }

    // Check permissions for start/end/reroll
    if (['start', 'end', 'reroll'].includes(action)) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply(
          '❌ You need the **Manage Server** permission to manage giveaways!'
        );
      }
    }

    if (action === 'start') {
      const duration = args[1];
      const winners = parseInt(args[2]);
      const prize = args.slice(3).join(' ');

      if (!duration || !winners || !prize) {
        return message.reply(
          '❌ Usage: `//giveaway start <duration> <winners> <prize>`\n' +
            'Example: `//giveaway start 1d 1 Discord Nitro`'
        );
      }

      // Parse duration
      const durationRegex = /^(\d+)([smhd])$/;
      const match = duration.match(durationRegex);

      if (!match) {
        return message.reply(
          '❌ Invalid duration! Use format like: `10m`, `1h`, `1d`, `7d`'
        );
      }

      const amount = parseInt(match[1]);
      const unit = match[2];
      const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      const durationMs = amount * multipliers[unit];

      if (durationMs < 60000) {
        return message.reply('❌ Giveaway must be at least 1 minute long!');
      }

      if (winners < 1 || winners > 20) {
        return message.reply('❌ Winners must be between 1 and 20!');
      }

      // Create giveaway embed
      const endTime = Date.now() + durationMs;
      const tierBadge = premiumPerks.getTierBadge(message.guild.id);

      const giveawayEmbed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(
          `**Prize:** ${prize}\n\n` +
            `**Winners:** ${winners}\n` +
            `**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n` +
            `**Hosted by:** ${message.author}\n\n` +
            `React with 🎉 to enter!\n\n` +
            `${tierBadge} **Premium Bonus:**\n` +
            `💎 Premium users get 2x entries\n` +
            `👑 VIP users get 3x entries`
        )
        .setFooter({
          text: `${winners} winner${winners > 1 ? 's' : ''} | Ends`,
        })
        .setTimestamp(endTime);

      const giveawayMsg = await message.channel.send({
        embeds: [giveawayEmbed],
      });
      await giveawayMsg.react('🎉');

      // Save giveaway data
      const giveaways = db.get('giveaways', message.guild.id) || {};
      giveaways[giveawayMsg.id] = {
        messageId: giveawayMsg.id,
        channelId: message.channel.id,
        guildId: message.guild.id,
        prize,
        winners,
        endTime,
        hostId: message.author.id,
        ended: false,
      };
      db.set('giveaways', message.guild.id, giveaways);

      return message.reply(
        `✅ Giveaway started! Ends <t:${Math.floor(endTime / 1000)}:R>`
      );
    }

    if (action === 'end') {
      const messageId = args[1];

      if (!messageId) {
        return message.reply('❌ Please provide the giveaway message ID!');
      }

      const giveaways = db.get('giveaways', message.guild.id) || {};
      const giveaway = giveaways[messageId];

      if (!giveaway) {
        return message.reply('❌ Giveaway not found!');
      }

      if (giveaway.ended) {
        return message.reply('❌ This giveaway has already ended!');
      }

      await endGiveaway(message.client, giveaway);
      return message.reply('✅ Giveaway ended!');
    }

    if (action === 'reroll') {
      const messageId = args[1];

      if (!messageId) {
        return message.reply('❌ Please provide the giveaway message ID!');
      }

      const giveaways = db.get('giveaways', message.guild.id) || {};
      const giveaway = giveaways[messageId];

      if (!giveaway) {
        return message.reply('❌ Giveaway not found!');
      }

      if (!giveaway.ended) {
        return message.reply('❌ This giveaway has not ended yet!');
      }

      await endGiveaway(message.client, giveaway, true);
      return message.reply('✅ Giveaway rerolled!');
    }

    if (action === 'list') {
      const giveaways = db.get('giveaways', message.guild.id) || {};
      const activeGiveaways = Object.values(giveaways).filter(g => !g.ended);

      if (activeGiveaways.length === 0) {
        return message.reply('📭 No active giveaways!');
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎉 Active Giveaways')
        .setDescription(
          activeGiveaways
            .map(
              g =>
                `**${g.prize}**\n` +
                `Channel: <#${g.channelId}>\n` +
                `Ends: <t:${Math.floor(g.endTime / 1000)}:R>\n` +
                `Message ID: \`${g.messageId}\``
            )
            .join('\n\n')
        )
        .setFooter({
          text: `Total: ${activeGiveaways.length} active giveaway${activeGiveaways.length > 1 ? 's' : ''}`,
        });

      return message.reply({ embeds: [embed] });
    }
  },
};

async function endGiveaway(client, giveaway, isReroll = false) {
  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const giveawayMsg = await channel.messages.fetch(giveaway.messageId);

    // Get reactions
    const reaction = giveawayMsg.reactions.cache.get('🎉');
    if (!reaction) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🎉 Giveaway Ended')
        .setDescription(`**Prize:** ${giveaway.prize}\n\n❌ No valid entries!`);

      await giveawayMsg.edit({ embeds: [embed] });
      return;
    }

    const users = await reaction.users.fetch();
    let participants = users.filter(u => !u.bot);

    if (participants.size === 0) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🎉 Giveaway Ended')
        .setDescription(`**Prize:** ${giveaway.prize}\n\n❌ No valid entries!`);

      await giveawayMsg.edit({ embeds: [embed] });
      return;
    }

    // Apply premium multipliers
    const guild = await client.guilds.fetch(giveaway.guildId);
    const entriesMap = new Map();

    for (const [userId, user] of participants) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue;

      // Check premium status
      const tierName = premiumPerks.getTierDisplayName(giveaway.guildId);
      let entries = 1;

      if (tierName === 'VIP') {
        entries = 3;
      } else if (tierName === 'Premium') {
        entries = 2;
      }

      entriesMap.set(userId, { user, entries });
    }

    // Create weighted array
    const weightedEntries = [];
    for (const [userId, data] of entriesMap) {
      for (let i = 0; i < data.entries; i++) {
        weightedEntries.push(data.user);
      }
    }

    // Pick winners
    const winners = [];
    const winnerIds = new Set();

    for (let i = 0; i < giveaway.winners && weightedEntries.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * weightedEntries.length);
      const winner = weightedEntries[randomIndex];

      if (!winnerIds.has(winner.id)) {
        winners.push(winner);
        winnerIds.add(winner.id);
      }

      // Remove all entries from this winner
      for (let j = weightedEntries.length - 1; j >= 0; j--) {
        if (weightedEntries[j].id === winner.id) {
          weightedEntries.splice(j, 1);
        }
      }
    }

    if (winners.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🎉 Giveaway Ended')
        .setDescription(`**Prize:** ${giveaway.prize}\n\n❌ No valid entries!`);

      await giveawayMsg.edit({ embeds: [embed] });
      return;
    }

    // Update message
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🎉 Giveaway Ended!')
      .setDescription(
        `**Prize:** ${giveaway.prize}\n\n` +
          `**Winner${winners.length > 1 ? 's' : ''}:** ${winners.map(w => `<@${w.id}>`).join(', ')}\n\n` +
          `**Hosted by:** <@${giveaway.hostId}>`
      )
      .setFooter({ text: isReroll ? 'Rerolled' : 'Ended' })
      .setTimestamp();

    await giveawayMsg.edit({ embeds: [embed] });

    // Announce winners
    await channel.send(
      `🎉 Congratulations ${winners.map(w => `<@${w.id}>`).join(', ')}! You won **${giveaway.prize}**!`
    );

    // Mark as ended
    if (!isReroll) {
      const giveaways = db.get('giveaways', giveaway.guildId) || {};
      if (giveaways[giveaway.messageId]) {
        giveaways[giveaway.messageId].ended = true;
        db.set('giveaways', giveaway.guildId, giveaways);
      }
    }
  } catch (error) {
    const logger = require('../../utils/logger');
const branding = require('../../utils/branding');
    logger.error('Giveaway end error:', error);
  }
}

// Export for use in scheduled task
module.exports.endGiveaway = endGiveaway;
