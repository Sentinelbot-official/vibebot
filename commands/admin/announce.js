const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'announce',
  aliases: ['announcement'],
  description: 'Send an announcement to a channel',
  usage: '<#channel> <message>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ You need Manage Server permission!');
    }

    const channel = message.mentions.channels.first();

    if (!channel) {
      return message.reply('❌ Usage: `announce <#channel> <message>`');
    }

    const announcement = args.slice(1).join(' ');

    if (!announcement) {
      return message.reply('❌ Please provide an announcement message!');
    }

    // Validate announcement length
    if (announcement.length > 2000) {
      return message.reply(
        '❌ Announcement is too long! Maximum 2000 characters.'
      );
    }

    // Sanitize @everyone/@here mentions
    const sanitizedAnnouncement = announcement
      .replace(/@everyone/gi, '@\u200beveryone')
      .replace(/@here/gi, '@\u200bhere');

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📢 Announcement')
      .setDescription(sanitizedAnnouncement)
      .setFooter({
        text: `Announced by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      await channel.send({
        embeds: [embed],
        allowedMentions: { parse: ['users'] },
      });
      message.reply(`✅ Announcement sent to ${channel}!`);

      // Delete command message
      setTimeout(() => message.delete().catch(() => {}), 3000);
    } catch (error) {
      console.error('Error sending announcement:', error);
      message.reply('❌ Failed to send announcement!');
    }
  },
};
