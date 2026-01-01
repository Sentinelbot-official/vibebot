const db = require('../utils/database');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const responses = db.get('smart_responses', message.guild.id);

    if (!responses || !responses.enabled || responses.triggers.length === 0) {
      return;
    }

    const content = message.content.toLowerCase();

    // Find matching trigger
    for (const trigger of responses.triggers) {
      if (matchesTrigger(content, trigger.trigger)) {
        // Check cooldown (per user, per trigger)
        const cooldownKey = `smartreply_${message.guild.id}_${message.author.id}_${trigger.id}`;
        const lastUsed = db.get('cooldowns', cooldownKey);

        if (lastUsed && Date.now() - lastUsed < 60000) {
          // 1 minute cooldown
          continue;
        }

        // Send response
        try {
          await message.reply(trigger.response);

          // Update stats
          trigger.uses++;
          db.set('smart_responses', message.guild.id, responses);

          // Set cooldown
          db.set('cooldowns', cooldownKey, Date.now());

          break; // Only respond to first match
        } catch (error) {
          console.error('Error sending smart response:', error);
        }
      }
    }
  },
};

function matchesTrigger(content, trigger) {
  // Exact match
  if (content === trigger) return true;

  // Contains trigger as whole word
  const regex = new RegExp(`\\b${escapeRegex(trigger)}\\b`, 'i');
  return regex.test(content);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
