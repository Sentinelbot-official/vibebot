const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'accountage',
  description: 'Configure account age verification for new members',
  usage: '<enable/disable/config> [minDays] [action]',
  aliases: ['ageverify', 'agecheck'],
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      return message.reply(
        '❌ You need the Manage Server permission to use this command!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (
      !action ||
      !['enable', 'disable', 'config', 'status'].includes(action)
    ) {
      return message.reply(
        '❌ Usage: `accountage <enable/disable/config/status> [minDays] [action]`\nExample: `accountage config 7 kick`'
      );
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    const ageVerification = settings.accountAgeVerification || {
      enabled: false,
      minDays: 7,
      action: 'kick',
    };

    if (action === 'status') {
      const embed = new EmbedBuilder()
        .setColor(ageVerification.enabled ? 0x00ff00 : 0xff0000)
        .setTitle('⚙️ Account Age Verification')
        .addFields(
          {
            name: '📊 Status',
            value: ageVerification.enabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
          {
            name: '📅 Minimum Age',
            value: `${ageVerification.minDays} days`,
            inline: true,
          },
          { name: '⚡ Action', value: ageVerification.action, inline: true }
        )
        .setDescription(
          ageVerification.enabled
            ? `New members must have accounts older than ${ageVerification.minDays} days, or they will be ${ageVerification.action}ed.`
            : 'Account age verification is currently disabled.'
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'enable') {
      ageVerification.enabled = true;
      settings.accountAgeVerification = ageVerification;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Account Age Verification Enabled')
        .setDescription(
          `New members must have accounts older than **${ageVerification.minDays} days**, or they will be **${ageVerification.action}ed**.`
        )
        .addFields({
          name: '⚙️ Configure',
          value: 'Use `accountage config <days> <action>` to change settings',
          inline: false,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'disable') {
      ageVerification.enabled = false;
      settings.accountAgeVerification = ageVerification;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Account Age Verification Disabled')
        .setDescription(
          'New members will no longer be checked for account age.'
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'config') {
      const minDays = parseInt(args[1]);
      const actionType = args[2]?.toLowerCase();

      if (!minDays || minDays < 1 || minDays > 365) {
        return message.reply(
          '❌ Please provide a valid minimum age in days (1-365)!'
        );
      }

      if (!actionType || !['kick', 'ban'].includes(actionType)) {
        return message.reply('❌ Please specify an action: `kick` or `ban`!');
      }

      ageVerification.minDays = minDays;
      ageVerification.action = actionType;
      settings.accountAgeVerification = ageVerification;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('⚙️ Account Age Verification Configured')
        .addFields(
          { name: '📅 Minimum Age', value: `${minDays} days`, inline: true },
          { name: '⚡ Action', value: actionType, inline: true },
          {
            name: '📊 Status',
            value: ageVerification.enabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          }
        )
        .setDescription(
          ageVerification.enabled
            ? `Configuration updated! New members with accounts younger than ${minDays} days will be ${actionType}ed.`
            : `Configuration saved! Use \`accountage enable\` to activate.`
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
