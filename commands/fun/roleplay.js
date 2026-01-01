const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'roleplay',
  aliases: ['rp', 'action'],
  description: 'Roleplay actions and interactions',
  usage: '<action> [@user]',
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    const target = message.mentions.users.first();

    const actions = {
      hug: { emoji: '🤗', text: 'hugs', gif: 'hug' },
      pat: { emoji: '👋', text: 'pats', gif: 'pat' },
      kiss: { emoji: '💋', text: 'kisses', gif: 'kiss' },
      slap: { emoji: '👋', text: 'slaps', gif: 'slap' },
      wave: { emoji: '👋', text: 'waves at', gif: 'wave' },
      dance: { emoji: '💃', text: 'dances with', gif: 'dance' },
      highfive: { emoji: '✋', text: 'high-fives', gif: 'highfive' },
      poke: { emoji: '👉', text: 'pokes', gif: 'poke' },
      cuddle: { emoji: '🤗', text: 'cuddles', gif: 'cuddle' },
      bonk: { emoji: '🔨', text: 'bonks', gif: 'bonk' },
    };

    if (!action || !actions[action]) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎭 Roleplay Actions')
        .setDescription(
          '**Available Actions:**\n' +
            Object.keys(actions)
              .map(a => `${actions[a].emoji} \`//rp ${a} @user\``)
              .join('\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const actionData = actions[action];
    const text = target
      ? `${actionData.emoji} **${message.author.username}** ${actionData.text} **${target.username}**!`
      : `${actionData.emoji} **${message.author.username}** ${actionData.text}!`;

    return message.reply(text);
  },
};
