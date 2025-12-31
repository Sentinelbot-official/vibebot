const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'greroll',
  description: 'Reroll a giveaway winner',
  usage: '<messageId>',
  category: 'giveaway',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need Manage Server permission to reroll giveaways!'
      );
    }

    if (!args[0]) {
      return message.reply('❌ Please provide the giveaway message ID!');
    }

    const messageId = args[0];
    const giveaways = db.get('giveaways', message.guild.id);

    if (!giveaways || !giveaways[messageId]) {
      return message.reply('❌ No giveaway found with that message ID!');
    }

    const giveaway = giveaways[messageId];
    if (!giveaway.ended) {
      return message.reply("❌ That giveaway hasn't ended yet!");
    }

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

      // Pick new winner
      const newWinner = entries.random();

      // Announce new winner
      await channel.send(
        `🎉 New winner: ${newWinner}! You won **${giveaway.prize}**! (Rerolled)`
      );

      message.reply('✅ Giveaway rerolled successfully!');
    } catch (error) {
      console.error('Error rerolling giveaway:', error);
      message.reply('❌ Failed to reroll giveaway!');
    }
  },
};
