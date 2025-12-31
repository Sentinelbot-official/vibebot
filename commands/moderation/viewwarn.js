const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'viewwarns',
  description: 'View the warnings of a member',
  usage: '<@member>',
  category: 'moderation',
  async execute(message, args) {
    // Get member
    const member =
      message.mentions.members.first() ||
      (await message.guild.members.fetch(args[0]).catch(() => null));

    if (!member) {
      return message.reply(
        '❌ Please mention a member or provide a valid user ID.'
      );
    }

    // Get warnings
    const warns = db.get('warns', member.id) || [];

    if (warns.length === 0) {
      return message.reply(`✅ ${member.user.tag} has no warnings.`);
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setColor(
        warns.length >= 5 ? 0xff0000 : warns.length >= 3 ? 0xffa500 : 0xffff00
      )
      .setTitle(`⚠️ Warnings for ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription(`Total Warnings: **${warns.length}**\n\u200b`)
      .setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    // Add each warning as a field
    warns.forEach((warn, index) => {
      const warnNumber = index + 1;
      const date = new Date(warn.date).toLocaleString();

      embed.addFields({
        name: `${warnNumber}. Case ID: ${warn.caseId}`,
        value:
          `**Reason:** ${warn.reason}\n` +
          `**Moderator:** ${warn.moderator.tag}\n` +
          `**Date:** ${date}\n` +
          `**Channel:** <#${warn.channel}>`,
        inline: false,
      });
    });

    await message.reply({ embeds: [embed] });
  },
};
