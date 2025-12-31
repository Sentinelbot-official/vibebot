const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');

// Store active marriage proposals
const proposals = new Map();

module.exports = {
  name: 'marry',
  description: 'Propose marriage to another user',
  usage: '<@user>',
  aliases: ['propose', 'marriage'],
  category: 'social',
  cooldown: 10,
  async execute(message, args) {
    const targetUser = message.mentions.users.first();

    if (!targetUser) {
      return message.reply(
        '❌ Please mention someone to propose to!\nUsage: `marry @user`'
      );
    }

    if (targetUser.id === message.author.id) {
      return message.reply('❌ You cannot marry yourself!');
    }

    if (targetUser.bot) {
      return message.reply('❌ You cannot marry bots!');
    }

    // Check if proposer is already married
    const proposerMarriage = db.get('marriages', message.author.id);
    if (proposerMarriage) {
      return message.reply(
        `❌ You are already married to <@${proposerMarriage.partnerId}>!`
      );
    }

    // Check if target is already married
    const targetMarriage = db.get('marriages', targetUser.id);
    if (targetMarriage) {
      return message.reply(
        `❌ ${targetUser.username} is already married to someone else!`
      );
    }

    // Create proposal
    const proposalId = `${message.author.id}-${targetUser.id}-${Date.now()}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`marry_accept_${proposalId}`)
        .setLabel('Accept 💍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`marry_decline_${proposalId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('💍 Marriage Proposal')
      .setDescription(
        `${message.author} is proposing to ${targetUser}!\n\n*"Will you marry me?"*`
      )
      .setImage(
        'https://media.tenor.com/images/c6b8e1d8f8f8e8e8e8e8e8e8e8e8e8e8/tenor.gif'
      )
      .setFooter({ text: 'Proposal expires in 60 seconds' })
      .setTimestamp();

    const proposalMessage = await message.reply({
      content: `${targetUser}`,
      embeds: [embed],
      components: [row],
    });

    // Store proposal
    proposals.set(proposalId, {
      proposerId: message.author.id,
      targetId: targetUser.id,
      messageId: proposalMessage.id,
      expiresAt: Date.now() + 60000,
    });

    // Auto-expire
    setTimeout(() => {
      if (proposals.has(proposalId)) {
        proposals.delete(proposalId);
        const expiredEmbed = EmbedBuilder.from(embed)
          .setColor(0x808080)
          .setFooter({ text: 'Proposal expired' });
        proposalMessage
          .edit({ embeds: [expiredEmbed], components: [] })
          .catch(() => {});
      }
    }, 60000);
  },
};

// Export handler for button interactions
module.exports.handleMarriageButton = async interaction => {
  const [, action, proposalId] = interaction.customId.split('_');

  if (!proposals.has(proposalId)) {
    return interaction.reply({
      content: '❌ This proposal has expired!',
      ephemeral: true,
    });
  }

  const proposal = proposals.get(proposalId);

  // Only the target can accept/decline
  if (interaction.user.id !== proposal.targetId) {
    return interaction.reply({
      content: '❌ This proposal is not for you!',
      ephemeral: true,
    });
  }

  if (action === 'accept') {
    // Double-check neither is married
    const proposerMarriage = db.get('marriages', proposal.proposerId);
    const targetMarriage = db.get('marriages', proposal.targetId);

    if (proposerMarriage || targetMarriage) {
      proposals.delete(proposalId);
      return interaction.update({
        content: '❌ Marriage failed! One of you is already married.',
        embeds: [],
        components: [],
      });
    }

    // Create marriage
    const marriageData = {
      partnerId: proposal.targetId,
      marriedAt: Date.now(),
      marriedDate: new Date().toISOString(),
    };

    const partnerData = {
      partnerId: proposal.proposerId,
      marriedAt: Date.now(),
      marriedDate: new Date().toISOString(),
    };

    db.set('marriages', proposal.proposerId, marriageData);
    db.set('marriages', proposal.targetId, partnerData);

    const successEmbed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('💒 Just Married!')
      .setDescription(
        `🎉 Congratulations! <@${proposal.proposerId}> and <@${proposal.targetId}> are now married!`
      )
      .addFields({
        name: '💕 Anniversary',
        value: new Date().toLocaleDateString(),
        inline: false,
      })
      .setFooter({ text: 'Wishing you a lifetime of happiness together!' })
      .setTimestamp();

    proposals.delete(proposalId);
    return interaction.update({ embeds: [successEmbed], components: [] });
  } else {
    // Declined
    const declineEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('💔 Proposal Declined')
      .setDescription(`<@${proposal.targetId}> declined the proposal.`)
      .setTimestamp();

    proposals.delete(proposalId);
    return interaction.update({ embeds: [declineEmbed], components: [] });
  }
};
