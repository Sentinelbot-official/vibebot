const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'story',
  aliases: ['origin', 'journey', 'about'],
  description: "Learn about Vibe Bot's unique origin story!",
  category: 'general',
  cooldown: 10,
  execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🔴 The Vibe Bot 24/7 Story')
      .setThumbnail(message.client.user.displayAvatarURL())
      .setDescription(
        `**Welcome to the 24/7 journey!** 🎵\n\n` +
          `This isn't just another Discord bot - this is a story of collaboration, ` +
          `a global community, and round-the-clock coding sessions!`
      )
      .addFields(
        {
          name: '🎭 Chapter 1: The Beginning',
          value:
            `On **December 31, 2025**, streamer Airis went live on Twitch with a crazy idea: ` +
            `*"Let's build a Discord bot from scratch, LIVE 24/7, with chat helping!"*\n\n` +
            `The stream never stopped. What started as a project quickly became a ` +
            `global phenomenon with viewers from every timezone contributing!`,
          inline: false,
        },
        {
          name: '💜 Chapter 2: The Global Community',
          value:
            `With a **24/7 stream**, viewers from around the world weren't just watching - ` +
            `they were **building** with us! Morning coffee coders in Europe, afternoon ` +
            `debuggers in America, late-night testers in Asia - everyone contributed!\n\n` +
            `From 130 commands to 220+ commands, each one has a story from a different timezone.`,
          inline: false,
        },
        {
          name: '🚀 Chapter 3: The Evolution',
          value:
            `**v1.0:** Basic commands (coded with morning viewers)\n` +
            `**v2.0:** Economy, leveling, mini-games (afternoon crew helped)\n` +
            `**v2.1:** AI integration (late-night debugging squad)\n` +
            `**v2.2:** Business system, clans, 220+ commands! (global effort)\n\n` +
            `Each version was coded live 24/7 with viewers from every timezone!`,
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
            `**global community** comes together around the clock. Every command you use ` +
            `was suggested, debated, coded, and tested with real people watching - ` +
            `no matter what time zone they're in!\n\n` +
            `**That's what makes me unique.** 🎵`,
          inline: false,
        },
        {
          name: '🔴 Want to be part of the story?',
          value:
            `**LIVE NOW (24/7):** https://twitch.tv/projectdraguk\n` +
            `Contribute on GitHub: https://github.com/Sentinelbot-official/vibebot\n\n` +
            `**No matter where you are or what time it is - we're live!**\n` +
            `**Let's vibe together!** 💜`,
          inline: false,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
