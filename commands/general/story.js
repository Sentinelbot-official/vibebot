const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'story',
  aliases: ['origin', 'journey', 'about'],
  description: 'Learn about Vibe Bot\'s unique origin story!',
  category: 'general',
  cooldown: 10,
  execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎬 The Vibe Bot Story')
      .setThumbnail(message.client.user.displayAvatarURL())
      .setDescription(
        `**Welcome to the journey!** 🎵\n\n` +
          `This isn't just another Discord bot - this is a story of collaboration, ` +
          `community, and late-night coding sessions!`
      )
      .addFields(
        {
          name: '🎭 Chapter 1: The Beginning',
          value:
            `On **December 31, 2025**, streamer Airis went live on Twitch with a crazy idea: ` +
            `*"Let's build a Discord bot from scratch, LIVE, with chat helping!"*\n\n` +
            `What started as a simple project quickly became something special.`,
          inline: false,
        },
        {
          name: '💜 Chapter 2: The Community',
          value:
            `Chat wasn't just watching - they were **building** with us! Every feature suggestion, ` +
            `every bug report, every "try this!" in chat shaped what I became.\n\n` +
            `From 130 commands to 220+ commands, each one has a story.`,
          inline: false,
        },
        {
          name: '🚀 Chapter 3: The Evolution',
          value:
            `**v1.0:** Basic commands\n` +
            `**v2.0:** Economy, leveling, mini-games\n` +
            `**v2.1:** AI integration, advanced features\n` +
            `**v2.2:** Business system, clans, 220+ commands!\n\n` +
            `Each version was coded live with the community watching and helping.`,
          inline: false,
        },
        {
          name: '🎯 Chapter 4: What Makes Me Special',
          value:
            `🤖 **AI-Powered:** OpenAI & Anthropic integration\n` +
            `🎮 **220+ Commands:** More than most bots\n` +
            `💰 **Full Economy:** Jobs, stocks, property, crafting\n` +
            `🎨 **Mini-Games:** Hangman, Wordle, Poker, 2048, and more\n` +
            `🛡️ **Smart Auto-Mod:** AI-powered moderation\n` +
            `👥 **Social Features:** Marriage, clans, profiles\n` +
            `🎬 **Built Live:** Every feature coded on stream!`,
          inline: false,
        },
        {
          name: '💭 Chapter 5: The Philosophy',
          value:
            `I'm not just lines of code - I'm a testament to what happens when a ` +
            `community comes together. Every command you use was suggested, debated, ` +
            `coded, and tested with real people watching.\n\n` +
            `**That's what makes me unique.** 🎵`,
          inline: false,
        },
        {
          name: '🎬 Want to be part of the story?',
          value:
            `Watch the development live: https://twitch.tv/projectdraguk\n` +
            `Contribute on GitHub: https://github.com/Sentinelbot-official/vibebot\n\n` +
            `**Let's vibe together!** 💜`,
          inline: false,
        }
      )
      .setFooter({
        text: 'Built with ❤️ by Airis & The Community | Every feature has a story',
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
