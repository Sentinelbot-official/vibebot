const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'screenshot',
  aliases: ['ss', 'preview'],
  description: 'Take a screenshot of a website',
  usage: '<url>',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a URL!\nUsage: `screenshot <url>`\nExample: `screenshot https://discord.com`'
      );
    }

    const url = args[0];

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return message.reply('❌ Please provide a valid URL!');
    }

    const loadingMsg = await message.reply('📸 Taking screenshot...');

    try {
      // Try multiple free screenshot APIs in order of preference

      // 1. Try Screenshot Machine API (if key provided)
      const screenshotMachineKey = process.env.SCREENSHOT_MACHINE_KEY;
      if (screenshotMachineKey) {
        const screenshotUrl = `https://api.screenshotmachine.com/?key=${screenshotMachineKey}&url=${encodeURIComponent(url)}&dimension=1024x768&format=png&cacheLimit=0`;

        const embed = new EmbedBuilder()
          .setColor(branding.colors.info)
          .setTitle('📸 Website Screenshot')
          .setDescription(`Preview of: ${url}`)
          .setImage(screenshotUrl)
          .setFooter(branding.footers.default)
          .setTimestamp();

        return loadingMsg.edit({ content: null, embeds: [embed] });
      }

      // 2. Try Screenshotlayer API (if key provided)
      const screenshotlayerKey = process.env.SCREENSHOTLAYER_KEY;
      if (screenshotlayerKey) {
        const screenshotUrl = `https://api.screenshotlayer.com/api/capture?access_key=${screenshotlayerKey}&url=${encodeURIComponent(url)}&viewport=1024x768&format=PNG`;

        const embed = new EmbedBuilder()
          .setColor(branding.colors.info)
          .setTitle('📸 Website Screenshot')
          .setDescription(`Preview of: ${url}`)
          .setImage(screenshotUrl)
          .setFooter(branding.footers.default)
          .setTimestamp();

        return loadingMsg.edit({ content: null, embeds: [embed] });
      }

      // 3. Try ApiFlash (if key provided)
      const apiflashKey = process.env.APIFLASH_KEY;
      if (apiflashKey) {
        const screenshotUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${apiflashKey}&url=${encodeURIComponent(url)}&width=1024&height=768&format=png&fresh=true`;

        const embed = new EmbedBuilder()
          .setColor(branding.colors.info)
          .setTitle('📸 Website Screenshot')
          .setDescription(`Preview of: ${url}`)
          .setImage(screenshotUrl)
          .setFooter(branding.footers.default)
          .setTimestamp();

        return loadingMsg.edit({ content: null, embeds: [embed] });
      }

      // 4. Try free services (no key required, but may have limitations)

      // Try shot.screenshotapi.net (free, no key)
      try {
        const freeUrl = `https://shot.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&width=1024&height=768&output=image&file_type=png&wait_for_event=load`;

        // Test if the URL is accessible
        await axios.head(freeUrl, { timeout: 5000 });

        const embed = new EmbedBuilder()
          .setColor(branding.colors.info)
          .setTitle('📸 Website Screenshot')
          .setDescription(`Preview of: ${url}`)
          .setImage(freeUrl)
          .setFooter(branding.footers.default)
          .setTimestamp();

        return loadingMsg.edit({ content: null, embeds: [embed] });
      } catch (freeError) {
        // Free service failed, continue to fallback
      }

      // Fallback: Provide setup instructions
      const setupEmbed = new EmbedBuilder()
        .setColor(branding.colors.warning)
        .setTitle('📸 Screenshot Service Not Configured')
        .setDescription(
          'To use the screenshot feature, add one of these API keys to your .env file:'
        )
        .addFields(
          {
            name: '1. Screenshot Machine (Recommended)',
            value:
              'Get key: [screenshotmachine.com](https://screenshotmachine.com)\nAdd: `SCREENSHOT_MACHINE_KEY=your_key`',
            inline: false,
          },
          {
            name: '2. Screenshotlayer',
            value:
              'Get key: [screenshotlayer.com](https://screenshotlayer.com)\nAdd: `SCREENSHOTLAYER_KEY=your_key`',
            inline: false,
          },
          {
            name: '3. ApiFlash',
            value:
              'Get key: [apiflash.com](https://apiflash.com)\nAdd: `APIFLASH_KEY=your_key`',
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return loadingMsg.edit({ content: null, embeds: [setupEmbed] });
    } catch (error) {
      console.error('Screenshot error:', error.message);

      return loadingMsg.edit(
        `❌ Failed to take screenshot: ${error.message}\n\nMake sure the URL is accessible and try again.`
      );
    }
  },
};
