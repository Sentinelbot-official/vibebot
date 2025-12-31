const { PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'gend',
  aliases: ['gstop'],
  description: 'End a giveaway early',
  usage: '<messageId>',
  category: 'giveaway',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need Manage Server permission to end giveaways!'
      );
    }

    if (!args[0]) {
      return message.reply('❌ Please provide the giveaway message ID!');
    }

    const messageId = args[0];
    const giveaways = db.get('giveaways', message.guild.id);

    if (!giveaways || !giveaways[messageId]) {
      return message.reply('❌ No active giveaway found with that message ID!');
    }

    const giveaway = giveaways[messageId];
    if (giveaway.ended) {
      return message.reply('❌ That giveaway has already ended!');
    }

    // End the giveaway immediately
    try {
      const channel = await message.guild.channels.fetch(giveaway.channelId);
      const giveawayMsg = await channel.messages.fetch(messageId);

      const reaction = giveawayMsg.reactions.cache.get('🎉');
      if (!reaction) {
        return message.reply('❌ No entries found for this giveaway!');
      }

      const users = await reaction.users.fetch();
      const entries = users.filter(u => !u.bot);

      if (entries.size === 0) {
        return message.reply('❌ No valid entries for this giveaway!');
      }

      // Pick winners
      const winnersCount = Math.min(giveaway.winners, entries.size);
      const winnersArray = entries.random(winnersCount);
      const winners = Array.isArray(winnersArray)
        ? winnersArray
        : [winnersArray];

      // Update embed
      const { EmbedBuilder } = require('discord.js');
      const embed = EmbedBuilder.from(giveawayMsg.embeds[0])
        .setColor(branding.colors.success)
        .setDescription(
          `**Prize:** ${giveaway.prize}\n\n` +
            `**Winners:** ${winners.map(w => w.toString()).join(', ')}\n` +
            `**Hosted by:** <@${giveaway.hostId}>\n\n` +
            'Giveaway ended early!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await giveawayMsg.edit({ embeds: [embed] });

      // Announce winners
      await channel.send(
        `🎉 Congratulations ${winners.map(w => w.toString()).join(', ')}! You won **${giveaway.prize}**!`
      );

      giveaway.ended = true;
      giveaway.winnersIds = winners.map(w => w.id);
      db.set('giveaways', message.guild.id, giveaways);

      message.reply('✅ Giveaway ended successfully!');
    } catch (error) {
      console.error('Error ending giveaway:', error);
      message.reply('❌ Failed to end giveaway!');
    }
  },
};
