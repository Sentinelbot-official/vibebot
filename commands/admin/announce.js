const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'announce',
  aliases: ['announcement'],
  description: 'Send an announcement to a channel',
  usage: '<#channel> <message>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return message.reply('❌ You need Manage Server permission!');
    }

    const channel = message.mentions.channels.first();

    if (!channel) {
      return message.reply('❌ Usage: `!announce <#channel> <message>`');
    }

    const announcement = args.slice(1).join(' ');

    if (!announcement) {
      return message.reply('❌ Please provide an announcement message!');
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📢 Announcement')
      .setDescription(announcement)
      .setFooter({
        text: `Announced by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    try {
      await channel.send({ embeds: [embed] });
      message.reply(`✅ Announcement sent to ${channel}!`);

      // Delete command message
      setTimeout(() => message.delete().catch(() => {}), 3000);
    } catch (error) {
      console.error('Error sending announcement:', error);
      message.reply('❌ Failed to send announcement!');
    }
  },
};
