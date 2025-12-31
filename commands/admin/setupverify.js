const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setupverify',
  description: 'Setup verification system',
  usage: '<#channel> <@role>',
  category: 'admin',
  cooldown: 10,
  guildOnly: true,
  async execute(message, _args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const channel = message.mentions.channels.first();
    const role = message.mentions.roles.first();

    if (!channel || !role) {
      return message.reply('❌ Usage: `setupverify <#channel> <@role>`');
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    settings.verification = {
      enabled: true,
      channelId: channel.id,
      roleId: role.id,
    };
    db.set('guild_settings', message.guild.id, settings);

    // Create verification panel
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Verification')
      .setDescription(
        `Welcome to **${message.guild.name}**!\n\n` +
          'Click the button below to verify and gain access to the server.\n\n' +
          `You will receive the ${role} role.`
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'Vibe Bot Verification System' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verify_button')
        .setLabel('Verify')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({ embeds: [embed], components: [row] });

    message.reply('✅ Verification system setup complete!');
  },
};
