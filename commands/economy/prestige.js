const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

// Store pending prestige confirmations
const prestigeConfirmations = new Map();

module.exports = {
  name: 'prestige',
  description: 'Reset your level for permanent bonuses (requires level 100)',
  category: 'economy',
  cooldown: 60,
  async execute(message) {
    const leveling = db.get('leveling', message.author.id) || {
      level: 1,
      xp: 0,
    };
    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
      prestige: 0,
    };

    if (leveling.level < 100) {
      return message.reply(
        `❌ You need to be level 100 to prestige! You are currently level ${leveling.level}.`
      );
    }

    const currentPrestige = economy.prestige || 0;
    const nextPrestige = currentPrestige + 1;

    // Calculate bonuses
    const xpBonus = nextPrestige * 10; // 10% per prestige
    const coinBonus = nextPrestige * 15; // 15% per prestige
    const prestigeReward = nextPrestige * 100000; // 100k coins per prestige

    const confirmId = `prestige_${message.author.id}_${Date.now()}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prestige_confirm_${confirmId}`)
        .setLabel('Confirm Prestige')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✨'),
      new ButtonBuilder()
        .setCustomId(`prestige_cancel_${confirmId}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌')
    );

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('✨ Prestige System')
      .setDescription(
        `**Are you sure you want to prestige?**\n\nThis will reset your level to 1 and XP to 0, but you'll gain permanent bonuses!`
      )
      .addFields(
        {
          name: '📊 Current Level',
          value: leveling.level.toString(),
          inline: true,
        },
        {
          name: '⭐ Current Prestige',
          value: currentPrestige.toString(),
          inline: true,
        },
        {
          name: '✨ New Prestige',
          value: nextPrestige.toString(),
          inline: true,
        },
        {
          name: '🎁 Prestige Reward',
          value: `${prestigeReward.toLocaleString()} coins`,
          inline: false,
        },
        {
          name: '📈 Permanent Bonuses',
          value: `• +${xpBonus}% XP gain\n• +${coinBonus}% coin earnings\n• Prestige ${nextPrestige} badge`,
          inline: false,
        }
      )
      .setFooter({ text: 'This action cannot be undone!' })
      .setTimestamp();

    const confirmMessage = await message.reply({
      embeds: [embed],
      components: [row],
    });

    prestigeConfirmations.set(confirmId, {
      userId: message.author.id,
      messageId: confirmMessage.id,
      prestigeLevel: nextPrestige,
      reward: prestigeReward,
      expiresAt: Date.now() + 30000,
    });

    // Auto-expire
    setTimeout(() => {
      if (prestigeConfirmations.has(confirmId)) {
        prestigeConfirmations.delete(confirmId);
        const expiredEmbed = EmbedBuilder.from(embed)
          .setColor(0x808080)
          .setFooter({ text: 'Prestige confirmation expired' });
        confirmMessage
          .edit({ embeds: [expiredEmbed], components: [] })
          .catch(() => {});
      }
    }, 30000);
  },
};

// Export handler for button interactions
module.exports.handlePrestigeButton = async interaction => {
  const [, action, confirmId] = interaction.customId.split('_');

  if (!prestigeConfirmations.has(confirmId)) {
    return interaction.reply({
      content: '❌ This prestige confirmation has expired!',
      flags: MessageFlags.Ephemeral,
    });
  }

  const confirmation = prestigeConfirmations.get(confirmId);

  if (interaction.user.id !== confirmation.userId) {
    return interaction.reply({
      content: '❌ This prestige confirmation is not for you!',
      flags: MessageFlags.Ephemeral,
    });
  }

  if (action === 'confirm') {
    // Reset leveling
    const leveling = db.get('leveling', interaction.user.id) || {
      level: 1,
      xp: 0,
    };
    leveling.level = 1;
    leveling.xp = 0;
    db.set('leveling', interaction.user.id, leveling);

    // Update economy with prestige
    const economy = db.get('economy', interaction.user.id) || {
      coins: 0,
      bank: 0,
      prestige: 0,
    };
    economy.prestige = confirmation.prestigeLevel;
    economy.coins += confirmation.reward;
    db.set('economy', interaction.user.id, economy);

    // Add prestige badge to profile
    const profile = db.get('profiles', interaction.user.id) || {
      bio: 'No bio set',
      badges: [],
    };
    const prestigeBadge = `✨${confirmation.prestigeLevel}`;
    if (!profile.badges) profile.badges = [];
    // Remove old prestige badges
    profile.badges = profile.badges.filter(b => !b.startsWith('✨'));
    profile.badges.push(prestigeBadge);
    db.set('profiles', interaction.user.id, profile);

    const successEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('✨ Prestige Complete!')
      .setDescription(
        `🎉 Congratulations! You are now **Prestige ${confirmation.prestigeLevel}**!`
      )
      .addFields(
        {
          name: '🎁 Reward',
          value: `${confirmation.reward.toLocaleString()} coins`,
          inline: true,
        },
        { name: '📊 New Level', value: '1', inline: true },
        {
          name: '⭐ Prestige',
          value: confirmation.prestigeLevel.toString(),
          inline: true,
        },
        {
          name: '📈 Bonuses Active',
          value: `• +${confirmation.prestigeLevel * 10}% XP\n• +${confirmation.prestigeLevel * 15}% coins`,
          inline: false,
        }
      )
      .setFooter({ text: 'Your journey begins anew!' })
      .setTimestamp();

    prestigeConfirmations.delete(confirmId);
    return interaction.update({ embeds: [successEmbed], components: [] });
  } else {
    const cancelEmbed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle('❌ Prestige Cancelled')
      .setDescription('You have cancelled the prestige process.')
      .setTimestamp();

    prestigeConfirmations.delete(confirmId);
    return interaction.update({ embeds: [cancelEmbed], components: [] });
  }
};
