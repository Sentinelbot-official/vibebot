const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'membercount',
  aliases: ['members', 'mc'],
  description: 'Show server member statistics',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  execute(message, args) {
    const guild = message.guild;

    const total = guild.memberCount;
    const humans = guild.members.cache.filter(m => !m.user.bot).size;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const online = guild.members.cache.filter(
      m => m.presence?.status === 'online'
    ).size;
    const idle = guild.members.cache.filter(
      m => m.presence?.status === 'idle'
    ).size;
    const dnd = guild.members.cache.filter(
      m => m.presence?.status === 'dnd'
    ).size;
    const offline = total - online - idle - dnd;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle(`📊 ${guild.name} Member Count`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '👥 Total Members', value: `${total}`, inline: true },
        { name: '👤 Humans', value: `${humans}`, inline: true },
        { name: '🤖 Bots', value: `${bots}`, inline: true },
        { name: '🟢 Online', value: `${online}`, inline: true },
        { name: '🟡 Idle', value: `${idle}`, inline: true },
        { name: '🔴 DND', value: `${dnd}`, inline: true },
        { name: '⚫ Offline', value: `${offline}`, inline: true }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
