const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');
const db = require('../../utils/database');

module.exports = {
  name: 'sentiment',
  aliases: ['analyze', 'mood', 'vibe'],
  description: 'Analyze sentiment and mood of messages',
  usage: '[text or @user]',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎭 Sentiment Analysis')
        .setDescription(
          '**Analyze the mood and emotion of messages!**\n\n' +
            '**Usage:**\n' +
            '`//sentiment <text>` - Analyze text\n' +
            "`//sentiment @user` - Analyze user's recent messages\n" +
            '`//sentiment channel` - Analyze channel mood\n\n' +
            '**Features:**\n' +
            '• Emotion detection (happy, sad, angry, etc.)\n' +
            '• Positivity/negativity score\n' +
            '• Confidence levels\n' +
            '• Historical tracking\n' +
            '• Channel mood analysis'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const target = message.mentions.users.first();
    const isChannel = args[0]?.toLowerCase() === 'channel';

    if (target) {
      // Analyze user's recent messages
      return analyzeUser(message, target);
    } else if (isChannel) {
      // Analyze channel mood
      return analyzeChannel(message);
    } else {
      // Analyze provided text
      const text = args.join(' ');
      return analyzeText(message, text);
    }
  },
};

async function analyzeText(message, text) {
  const analysis = analyzeSentiment(text);

  const embed = new EmbedBuilder()
    .setColor(analysis.color)
    .setTitle(`${analysis.emoji} Sentiment Analysis`)
    .setDescription(
      `**Text:** ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}\n\n` +
        `**Overall Sentiment:** ${analysis.sentiment}\n` +
        `**Confidence:** ${(analysis.confidence * 100).toFixed(1)}%\n\n` +
        `**Emotions Detected:**\n` +
        analysis.emotions
          .map(e => `${e.emoji} ${e.name}: ${e.score}%`)
          .join('\n')
    )
    .addFields(
      {
        name: '📊 Scores',
        value:
          `**Positivity:** ${analysis.positivity}%\n` +
          `**Negativity:** ${analysis.negativity}%\n` +
          `**Neutrality:** ${analysis.neutrality}%`,
        inline: true,
      },
      {
        name: '🎯 Indicators',
        value:
          `**Exclamation marks:** ${analysis.indicators.exclamations}\n` +
          `**Question marks:** ${analysis.indicators.questions}\n` +
          `**Emojis:** ${analysis.indicators.emojis}`,
        inline: true,
      }
    )
    .setFooter(branding.footers.default)
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function analyzeUser(message, user) {
  const loadingMsg = await message.reply('🔍 Analyzing recent messages...');

  try {
    // Fetch recent messages from user
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const userMessages = messages
      .filter(m => m.author.id === user.id && m.content.length > 0)
      .map(m => m.content)
      .slice(0, 20);

    if (userMessages.length === 0) {
      return loadingMsg.edit('❌ No recent messages found from this user!');
    }

    // Analyze combined text
    const combinedText = userMessages.join(' ');
    const analysis = analyzeSentiment(combinedText);

    // Store user sentiment history
    const history = db.get('sentiment_history', user.id) || [];
    history.push({
      guildId: message.guild.id,
      sentiment: analysis.sentiment,
      score: analysis.positivity - analysis.negativity,
      timestamp: Date.now(),
    });
    if (history.length > 100) history.shift();
    db.set('sentiment_history', user.id, history);

    const embed = new EmbedBuilder()
      .setColor(analysis.color)
      .setAuthor({
        name: `${user.tag}'s Sentiment`,
        iconURL: user.displayAvatarURL(),
      })
      .setTitle(`${analysis.emoji} Overall Mood: ${analysis.sentiment}`)
      .setDescription(
        `**Messages Analyzed:** ${userMessages.length}\n` +
          `**Confidence:** ${(analysis.confidence * 100).toFixed(1)}%\n\n` +
          `**Top Emotions:**\n` +
          analysis.emotions
            .slice(0, 3)
            .map(e => `${e.emoji} ${e.name}: ${e.score}%`)
            .join('\n')
      )
      .addFields(
        {
          name: '📊 Sentiment Breakdown',
          value:
            `**Positive:** ${analysis.positivity}%\n` +
            `**Negative:** ${analysis.negativity}%\n` +
            `**Neutral:** ${analysis.neutrality}%`,
          inline: true,
        },
        {
          name: '📈 Trends',
          value: getTrendText(history),
          inline: true,
        }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    await loadingMsg.edit({ content: null, embeds: [embed] });
  } catch (error) {
    console.error('User sentiment analysis error:', error);
    await loadingMsg.edit('❌ Failed to analyze user sentiment!');
  }
}

async function analyzeChannel(message) {
  const loadingMsg = await message.reply('🔍 Analyzing channel mood...');

  try {
    // Fetch recent messages
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const recentMessages = messages
      .filter(m => !m.author.bot && m.content.length > 0)
      .map(m => m.content);

    if (recentMessages.length === 0) {
      return loadingMsg.edit('❌ No recent messages found in this channel!');
    }

    // Analyze combined text
    const combinedText = recentMessages.join(' ');
    const analysis = analyzeSentiment(combinedText);

    const embed = new EmbedBuilder()
      .setColor(analysis.color)
      .setTitle(`${analysis.emoji} Channel Mood: ${analysis.sentiment}`)
      .setDescription(
        `**Messages Analyzed:** ${recentMessages.length}\n` +
          `**Overall Vibe:** ${analysis.sentiment}\n` +
          `**Confidence:** ${(analysis.confidence * 100).toFixed(1)}%\n\n` +
          `**Dominant Emotions:**\n` +
          analysis.emotions
            .slice(0, 3)
            .map(e => `${e.emoji} ${e.name}: ${e.score}%`)
            .join('\n')
      )
      .addFields({
        name: '📊 Channel Sentiment',
        value:
          `**Positive:** ${analysis.positivity}%\n` +
          `**Negative:** ${analysis.negativity}%\n` +
          `**Neutral:** ${analysis.neutrality}%`,
        inline: false,
      })
      .setFooter(branding.footers.default)
      .setTimestamp();

    await loadingMsg.edit({ content: null, embeds: [embed] });
  } catch (error) {
    console.error('Channel sentiment analysis error:', error);
    await loadingMsg.edit('❌ Failed to analyze channel mood!');
  }
}

function analyzeSentiment(text) {
  const textLower = text.toLowerCase();

  // Emotion keywords
  const emotions = {
    happy: {
      keywords: [
        'happy',
        'joy',
        'excited',
        'love',
        'great',
        'awesome',
        'amazing',
        'wonderful',
        'fantastic',
        'lol',
        'haha',
        '😊',
        '😄',
        '🎉',
        '❤️',
      ],
      emoji: '😊',
    },
    sad: {
      keywords: [
        'sad',
        'depressed',
        'down',
        'unhappy',
        'miserable',
        'crying',
        'tears',
        '😢',
        '😭',
        '💔',
      ],
      emoji: '😢',
    },
    angry: {
      keywords: [
        'angry',
        'mad',
        'furious',
        'rage',
        'hate',
        'annoyed',
        'frustrated',
        '😡',
        '😠',
        '🤬',
      ],
      emoji: '😡',
    },
    anxious: {
      keywords: [
        'anxious',
        'worried',
        'nervous',
        'stressed',
        'scared',
        'afraid',
        'concern',
        '😰',
        '😨',
      ],
      emoji: '😰',
    },
    excited: {
      keywords: [
        'excited',
        'hyped',
        'pumped',
        'thrilled',
        'eager',
        '🎉',
        '🔥',
        '⚡',
      ],
      emoji: '🎉',
    },
  };

  // Calculate emotion scores
  const emotionScores = {};
  for (const [emotion, data] of Object.entries(emotions)) {
    let score = 0;
    for (const keyword of data.keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = (textLower.match(regex) || []).length;
      score += matches;
    }
    emotionScores[emotion] = {
      name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      score: Math.min(100, score * 10),
      emoji: data.emoji,
    };
  }

  // Sort emotions by score
  const sortedEmotions = Object.values(emotionScores).sort(
    (a, b) => b.score - a.score
  );

  // Calculate positivity/negativity
  const positiveScore = emotionScores.happy.score + emotionScores.excited.score;
  const negativeScore =
    emotionScores.sad.score +
    emotionScores.angry.score +
    emotionScores.anxious.score;
  const total = positiveScore + negativeScore || 1;

  const positivity = Math.round((positiveScore / total) * 100);
  const negativity = Math.round((negativeScore / total) * 100);
  const neutrality = 100 - positivity - negativity;

  // Determine overall sentiment
  let sentiment, color, emoji;
  if (positivity > negativity + 20) {
    sentiment = 'Very Positive';
    color = branding.colors.success;
    emoji = '😊';
  } else if (positivity > negativity) {
    sentiment = 'Positive';
    color = branding.colors.primary;
    emoji = '🙂';
  } else if (negativity > positivity + 20) {
    sentiment = 'Very Negative';
    color = branding.colors.error;
    emoji = '😢';
  } else if (negativity > positivity) {
    sentiment = 'Negative';
    color = branding.colors.warning;
    emoji = '😕';
  } else {
    sentiment = 'Neutral';
    color = branding.colors.primary;
    emoji = '😐';
  }

  // Calculate confidence
  const confidence = Math.min(1, (positiveScore + negativeScore) / 50);

  // Count indicators
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const emojiMatches = text.match(/[\u{1F600}-\u{1F64F}]/gu) || [];

  return {
    sentiment,
    color,
    emoji,
    confidence,
    positivity,
    negativity,
    neutrality,
    emotions: sortedEmotions,
    indicators: {
      exclamations,
      questions,
      emojis: emojiMatches.length,
    },
  };
}

function getTrendText(history) {
  if (history.length < 2) return 'Not enough data';

  const recent = history.slice(-5);
  const scores = recent.map(h => h.score);
  const trend = scores[scores.length - 1] - scores[0];

  if (trend > 10) return '📈 Improving mood';
  if (trend < -10) return '📉 Declining mood';
  return '➡️ Stable mood';
}
