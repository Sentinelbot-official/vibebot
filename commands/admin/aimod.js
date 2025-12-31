const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const axios = require('axios');

module.exports = {
  name: 'aimod',
  description: 'AI-powered moderation for toxicity detection',
  usage: '<enable/disable/config/test> [settings]',
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return message.reply('❌ You need Manage Server permission!');
    }

    const action = args[0]?.toLowerCase();

    if (action === 'enable') {
      const apiKey = process.env.OPENAI_API_KEY || process.env.PERSPECTIVE_API_KEY;

      if (!apiKey) {
        return message.reply(
          '❌ AI Moderation requires an API key!\n\n' +
            '**Setup Options:**\n' +
            '1. **OpenAI** (Recommended): Add `OPENAI_API_KEY` to .env\n' +
            '2. **Perspective API** (Free): Add `PERSPECTIVE_API_KEY` to .env\n\n' +
            'Get Perspective API key: [Google Perspective](https://perspectiveapi.com)'
        );
      }

      const settings = db.get('guild_settings', message.guild.id) || {};
      settings.aiModeration = {
        enabled: true,
        threshold: 0.7, // 70% confidence
        action: 'warn', // warn, delete, timeout
        logChannel: null,
      };

      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        '✅ AI Moderation enabled!\n\n' +
          '**Settings:**\n' +
          '• Threshold: 70% (adjustable with `aimod config`)\n' +
          '• Action: Warn (change with `aimod config`)\n' +
          '• Messages will be analyzed for toxicity, harassment, threats, etc.'
      );
    }

    if (action === 'disable') {
      const settings = db.get('guild_settings', message.guild.id) || {};
      if (settings.aiModeration) {
        settings.aiModeration.enabled = false;
      }

      db.set('guild_settings', message.guild.id, settings);

      return message.reply('✅ AI Moderation disabled!');
    }

    if (action === 'config') {
      const setting = args[1]?.toLowerCase();
      const value = args[2];

      if (!setting || !value) {
        return message.reply(
          '❌ Usage: `aimod config <threshold/action/logchannel> <value>`\n\n' +
            '**Examples:**\n' +
            '`aimod config threshold 0.8` - Set to 80% confidence\n' +
            '`aimod config action delete` - Auto-delete toxic messages\n' +
            '`aimod config logchannel #logs` - Set log channel'
        );
      }

      const settings = db.get('guild_settings', message.guild.id) || {};
      if (!settings.aiModeration) {
        return message.reply('❌ AI Moderation is not enabled! Use `aimod enable` first.');
      }

      if (setting === 'threshold') {
        const threshold = parseFloat(value);
        if (isNaN(threshold) || threshold < 0.1 || threshold > 1) {
          return message.reply('❌ Threshold must be between 0.1 and 1.0!');
        }
        settings.aiModeration.threshold = threshold;
        db.set('guild_settings', message.guild.id, settings);
        return message.reply(
          `✅ AI Moderation threshold set to ${(threshold * 100).toFixed(0)}%`
        );
      }

      if (setting === 'action') {
        if (!['warn', 'delete', 'timeout'].includes(value)) {
          return message.reply('❌ Action must be: warn, delete, or timeout');
        }
        settings.aiModeration.action = value;
        db.set('guild_settings', message.guild.id, settings);
        return message.reply(`✅ AI Moderation action set to: ${value}`);
      }

      if (setting === 'logchannel') {
        const channel = message.mentions.channels.first();
        if (!channel) {
          return message.reply('❌ Please mention a channel!');
        }
        settings.aiModeration.logChannel = channel.id;
        db.set('guild_settings', message.guild.id, settings);
        return message.reply(`✅ AI Moderation logs will be sent to ${channel}`);
      }

      return message.reply('❌ Invalid setting! Use: threshold, action, or logchannel');
    }

    if (action === 'test') {
      const testMessage = args.slice(1).join(' ');

      if (!testMessage) {
        return message.reply(
          '❌ Please provide a message to test!\nUsage: `aimod test <message>`'
        );
      }

      const testingMsg = await message.reply('🤖 Analyzing message...');

      try {
        const result = await analyzeToxicity(testMessage);

        const embed = new EmbedBuilder()
          .setColor(result.isToxic ? 0xff0000 : 0x00ff00)
          .setTitle('🤖 AI Moderation Test')
          .setDescription(`**Message:** ${testMessage}`)
          .addFields(
            {
              name: 'Result',
              value: result.isToxic ? '❌ Toxic' : '✅ Clean',
              inline: true,
            },
            {
              name: 'Confidence',
              value: `${(result.confidence * 100).toFixed(1)}%`,
              inline: true,
            },
            {
              name: 'Categories',
              value: result.categories.join(', ') || 'None',
              inline: false,
            }
          )
          .setTimestamp();

        return testingMsg.edit({ content: null, embeds: [embed] });
      } catch (error) {
        return testingMsg.edit(`❌ Failed to analyze: ${error.message}`);
      }
    }

    if (action === 'status') {
      const settings = db.get('guild_settings', message.guild.id) || {};
      const aiMod = settings.aiModeration;

      if (!aiMod) {
        return message.reply(
          '❌ AI Moderation is not configured! Use `aimod enable` to set it up.'
        );
      }

      const embed = new EmbedBuilder()
        .setColor(aiMod.enabled ? 0x00ff00 : 0xff0000)
        .setTitle('🤖 AI Moderation Status')
        .addFields(
          {
            name: 'Status',
            value: aiMod.enabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
          {
            name: 'Threshold',
            value: `${(aiMod.threshold * 100).toFixed(0)}%`,
            inline: true,
          },
          {
            name: 'Action',
            value: aiMod.action,
            inline: true,
          },
          {
            name: 'Log Channel',
            value: aiMod.logChannel ? `<#${aiMod.logChannel}>` : 'Not set',
            inline: false,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `aimod <enable/disable/config/test/status>`\n\n' +
        '**Examples:**\n' +
        '`aimod enable` - Enable AI moderation\n' +
        '`aimod config threshold 0.8` - Set threshold\n' +
        '`aimod test your message here` - Test a message\n' +
        '`aimod status` - View current settings'
    );
  },
};

async function analyzeToxicity(text) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const perspectiveKey = process.env.PERSPECTIVE_API_KEY;

  if (openaiKey) {
    // Use OpenAI for moderation
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/moderations',
        { input: text },
        {
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.results[0];
      const categories = Object.entries(result.categories)
        .filter(([, value]) => value)
        .map(([key]) => key);

      return {
        isToxic: result.flagged,
        confidence: Math.max(...Object.values(result.category_scores)),
        categories,
      };
    } catch (error) {
      throw new Error('OpenAI moderation failed');
    }
  }

  if (perspectiveKey) {
    // Use Perspective API
    try {
      const response = await axios.post(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${perspectiveKey}`,
        {
          comment: { text },
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            PROFANITY: {},
            THREAT: {},
          },
        }
      );

      const scores = response.data.attributeScores;
      const toxicityScore = scores.TOXICITY.summaryScore.value;
      const categories = Object.entries(scores)
        .filter(([, data]) => data.summaryScore.value > 0.7)
        .map(([key]) => key.toLowerCase());

      return {
        isToxic: toxicityScore > 0.7,
        confidence: toxicityScore,
        categories,
      };
    } catch (error) {
      throw new Error('Perspective API failed');
    }
  }

  throw new Error('No API key configured');
}

module.exports.analyzeToxicity = analyzeToxicity;
