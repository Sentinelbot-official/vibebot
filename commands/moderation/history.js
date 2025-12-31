const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'history',
  aliases: ['modhistory', 'modlogs'],
  description: 'View full moderation history of a user',
  usage: '<@user>',
  category: 'moderation',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)
    ) {
      return message.reply('❌ You need Moderate Members permission!');
    }

    const target = message.mentions.members.first();
    if (!target) {
      return message.reply('❌ Usage: `history <@user>`');
    }

    const warns = db.get('warns', target.id) || [];

    if (warns.length === 0) {
      return message.reply(`✅ ${target.user.tag} has a clean record!`);
    }

    // Sort by timestamp (newest first)
    warns.sort((a, b) => b.timestamp - a.timestamp);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`📋 Moderation History: ${target.user.tag}`)
      .setDescription(`Total Infractions: **${warns.length}**`)
      .setThumbnail(target.user.displayAvatarURL());

    // Show last 10 warns
    const recentWarns = warns.slice(0, 10);

    for (const warn of recentWarns) {
      const moderator = await message.client.users
        .fetch(warn.moderator)
        .catch(() => null);
      const date = new Date(warn.timestamp);

      embed.addFields({
        name: `Case #${warn.caseId} - <t:${Math.floor(warn.timestamp / 1000)}:R>`,
        value: `**Moderator:** ${moderator ? moderator.tag : 'Unknown'}\n**Reason:** ${warn.reason || 'No reason'}\n**Warning:** #${warn.count}`,
        inline: false,
      });
    }

    if (warns.length > 10) {
      embed.setFooter({
        text: `Showing 10 of ${warns.length} total infractions`,
      });
    }

    message.reply({ embeds: [embed] });
  },
};
