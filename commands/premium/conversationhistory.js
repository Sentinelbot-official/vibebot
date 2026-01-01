const { EmbedBuilder } = require('discord.js');
const conversationMemory = require('../../utils/conversationMemory');
const branding = require('../../utils/branding');

module.exports = {
  name: 'conversationhistory',
  description: 'View or clear your AI conversation history',
  usage: '//conversationhistory [clear]',
  aliases: ['convhistory', 'chathistory', 'aimemory'],
  category: 'premium',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (action === 'clear') {
      conversationMemory.clearHistory(message.author.id, message.guild.id);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('🧹 Conversation History Cleared')
        .setDescription(
          'Your AI conversation history has been cleared.\n\n' +
            'The AI will no longer remember your previous conversations.'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Show history stats
    const stats = conversationMemory.getStats(
      message.author.id,
      message.guild.id
    );
    const history = conversationMemory.getHistory(
      message.author.id,
      message.guild.id,
      5
    );

    if (stats.totalMessages === 0) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.warning)
        .setTitle('💭 No Conversation History')
        .setDescription(
          'You haven\'t had any AI conversations yet!\n\n' +
            'Use `//aichat <message>` to start chatting with the AI.'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Format recent messages
    const recentMessages = history
      .slice(-5)
      .map(msg => {
        const emoji = msg.role === 'user' ? '👤' : '🤖';
        const content =
          msg.content.length > 100
            ? msg.content.substring(0, 97) + '...'
            : msg.content;
        const time = new Date(msg.timestamp).toLocaleTimeString();
        return `${emoji} **${msg.role === 'user' ? 'You' : 'AI'}** (${time})\n${content}`;
      })
      .join('\n\n');

    const ageMinutes = Math.floor(stats.age / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDisplay =
      ageHours > 0
        ? `${ageHours}h ${ageMinutes % 60}m`
        : `${ageMinutes}m`;

    const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
      .setTitle('💭 Your AI Conversation History')
      .setDescription(
        `**Statistics:**\n` +
          `📊 Total Messages: ${stats.totalMessages}\n` +
          `👤 Your Messages: ${stats.userMessages}\n` +
          `🤖 AI Responses: ${stats.assistantMessages}\n` +
          `⏰ Conversation Age: ${ageDisplay}\n\n` +
          `**Recent Messages:**\n\n${recentMessages}`
      )
      .setFooter({
        text: `${branding.footers.default.text} | Use //conversationhistory clear to reset`,
        iconURL: branding.footers.default.iconURL,
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
