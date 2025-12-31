const { Events } = require('discord.js');
const db = require('../utils/database');
const premiumPerks = require('../utils/premiumPerks');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    // Check if server has VIP (custom commands feature)
    if (!premiumPerks.hasFeature(message.guild.id, 'custom_commands')) return;

    // Check if message starts with //
    if (!message.content.startsWith('//')) return;

    // Get command name
    const args = message.content.slice(2).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Get custom commands for this server
    const customCommands = db.get('custom_commands', message.guild.id) || {};

    // Check if custom command exists
    if (!customCommands[commandName]) return;

    const command = customCommands[commandName];

    try {
      // Parse variables
      let response = command.response
        .replace(/{user}/g, `<@${message.author.id}>`)
        .replace(/{user\.name}/g, message.author.username)
        .replace(/{user\.tag}/g, message.author.tag)
        .replace(/{server}/g, message.guild.name)
        .replace(/{channel}/g, `<#${message.channel.id}>`)
        .replace(/{membercount}/g, message.guild.memberCount.toString())
        .replace(/{args}/g, args.join(' ') || 'No arguments provided')
        .replace(/{args\.1}/g, args[0] || '')
        .replace(/{args\.2}/g, args[1] || '')
        .replace(/{args\.3}/g, args[2] || '');

      // Send response
      await message.reply(response);

      // Increment usage counter
      command.uses = (command.uses || 0) + 1;
      customCommands[commandName] = command;
      db.set('custom_commands', message.guild.id, customCommands);
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error(`Custom command error (${commandName}):`, error);
    }
  },
};
