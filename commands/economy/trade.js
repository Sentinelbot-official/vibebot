const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');

// Store active trade requests
const tradeRequests = new Map();

module.exports = {
  name: 'trade',
  description: 'Trade coins with another user',
  usage: '<@user> <amount>',
  category: 'economy',
  cooldown: 10,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `trade @user <amount>`\nExample: `trade @user 1000`'
      );
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply('❌ Please mention a user to trade with!');
    }

    if (targetUser.id === message.author.id) {
      return message.reply('❌ You cannot trade with yourself!');
    }

    if (targetUser.bot) {
      return message.reply('❌ You cannot trade with bots!');
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply('❌ Please provide a valid amount greater than 0!');
    }

    // Check sender's balance
    const senderEconomy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };
    if (senderEconomy.coins < amount) {
      return message.reply(
        `❌ You don't have enough coins! You have ${senderEconomy.coins.toLocaleString()} coins.`
      );
    }

    // Create trade request
    const tradeId = `${message.author.id}-${targetUser.id}-${Date.now()}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`trade_accept_${tradeId}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`trade_decline_${tradeId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('💱 Trade Request')
      .setDescription(
        `${message.author} wants to trade **${amount.toLocaleString()} coins** with ${targetUser}!`
      )
      .addFields(
        { name: 'From', value: message.author.tag, inline: true },
        { name: 'To', value: targetUser.tag, inline: true },
        {
          name: 'Amount',
          value: `${amount.toLocaleString()} coins`,
          inline: true,
        }
      )
      .setFooter({ text: 'Trade expires in 60 seconds' })
      .setTimestamp();

    const tradeMessage = await message.reply({
      content: `${targetUser}`,
      embeds: [embed],
      components: [row],
    });

    // Store trade request
    tradeRequests.set(tradeId, {
      senderId: message.author.id,
      receiverId: targetUser.id,
      amount: amount,
      messageId: tradeMessage.id,
      expiresAt: Date.now() + 60000, // 60 seconds
    });

    // Auto-expire after 60 seconds
    setTimeout(() => {
      if (tradeRequests.has(tradeId)) {
        tradeRequests.delete(tradeId);
        const expiredEmbed = EmbedBuilder.from(embed)
          .setColor(0x808080)
          .setFooter({ text: 'Trade expired' });
        tradeMessage
          .edit({ embeds: [expiredEmbed], components: [] })
          .catch(() => {});
      }
    }, 60000);
  },
};

// Export handler for button interactions (to be used in events)
module.exports.handleTradeButton = async interaction => {
  const [action, , tradeId] = interaction.customId.split('_');

  if (!tradeRequests.has(tradeId)) {
    return interaction.reply({
      content: '❌ This trade request has expired!',
      ephemeral: true,
    });
  }

  const trade = tradeRequests.get(tradeId);

  // Only the receiver can accept/decline
  if (interaction.user.id !== trade.receiverId) {
    return interaction.reply({
      content: '❌ This trade request is not for you!',
      ephemeral: true,
    });
  }

  if (action === 'accept') {
    // Check sender still has the coins
    const senderEconomy = db.get('economy', trade.senderId) || {
      coins: 0,
      bank: 0,
    };
    if (senderEconomy.coins < trade.amount) {
      tradeRequests.delete(tradeId);
      return interaction.update({
        content: '❌ Trade failed! Sender no longer has enough coins.',
        embeds: [],
        components: [],
      });
    }

    // Get receiver economy
    const receiverEconomy = db.get('economy', trade.receiverId) || {
      coins: 0,
      bank: 0,
    };

    // Transfer coins
    senderEconomy.coins -= trade.amount;
    receiverEconomy.coins += trade.amount;

    db.set('economy', trade.senderId, senderEconomy);
    db.set('economy', trade.receiverId, receiverEconomy);

    const successEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Trade Completed!')
      .setDescription(
        `Successfully traded **${trade.amount.toLocaleString()} coins**!`
      )
      .addFields(
        { name: 'From', value: `<@${trade.senderId}>`, inline: true },
        { name: 'To', value: `<@${trade.receiverId}>`, inline: true },
        {
          name: 'Amount',
          value: `${trade.amount.toLocaleString()} coins`,
          inline: true,
        }
      )
      .setTimestamp();

    tradeRequests.delete(tradeId);
    return interaction.update({ embeds: [successEmbed], components: [] });
  } else {
    // Declined
    const declineEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Trade Declined')
      .setDescription(`<@${trade.receiverId}> declined the trade request.`)
      .setTimestamp();

    tradeRequests.delete(tradeId);
    return interaction.update({ embeds: [declineEmbed], components: [] });
  }
};
