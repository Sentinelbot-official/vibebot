const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'suggest',
  description: 'Make a suggestion',
  usage: '<suggestion>',
  category: 'utility',
  cooldown: 60,
  guildOnly: true,
  async execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Please provide a suggestion!');
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    const suggestionSettings = settings.suggestions || {};

    if (!suggestionSettings.enabled || !suggestionSettings.channelId) {
      return message.reply(
        '❌ Suggestions are not set up! Ask an admin to use `!setupsuggestions`'
      );
    }

    const channel = message.guild.channels.cache.get(
      suggestionSettings.channelId
    );
    if (!channel) {
      return message.reply('❌ Suggestion channel not found!');
    }

    const suggestion = args.join(' ');

    // Get suggestion count
    const suggestions = db.get('suggestions', message.guild.id) || {};
    const suggestionId = Object.keys(suggestions).length + 1;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle(`💡 Suggestion #${suggestionId}`)
      .setDescription(suggestion)
      .addFields(
        { name: 'Status', value: '⏳ Pending', inline: true },
        { name: 'Votes', value: '👍 0 | 👎 0', inline: true }
      )
      .setFooter({ text: `Suggested by ${message.author.tag}` })
      .setTimestamp();

    const suggestionMsg = await channel.send({ embeds: [embed] });
    await suggestionMsg.react('👍');
    await suggestionMsg.react('👎');

    // Store suggestion
    suggestions[suggestionId] = {
      messageId: suggestionMsg.id,
      userId: message.author.id,
      suggestion,
      status: 'pending',
      timestamp: Date.now(),
    };

    db.set('suggestions', message.guild.id, suggestions);

    message
      .reply(`✅ Your suggestion has been submitted! (ID: #${suggestionId})`)
      .then(m => {
        setTimeout(() => m.delete().catch(() => {}), 5000);
      });
    message.delete().catch(() => {});
  },
};
