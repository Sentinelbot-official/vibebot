const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'auction',
  aliases: ['bid'],
  description: 'Auction system for rare items',
  usage: '<create/list/bid/end>',
  category: 'economy',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['create', 'list', 'bid', 'end'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('⚖️ Auction House')
        .setDescription(
          '**Bid on rare items!**\n\n' +
            '**Commands:**\n' +
            '`//auction create <item> <starting_bid> <duration_hours>` - Start auction\n' +
            '`//auction list` - View active auctions\n' +
            '`//auction bid <auction_id> <amount>` - Place bid\n' +
            '`//auction end <auction_id>` - End your auction early\n\n' +
            '**Features:**\n' +
            '• Competitive bidding\n' +
            '• Automatic winner selection\n' +
            '• Bid history tracking\n' +
            '• Minimum bid increments'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'create') {
      const [, item, startBidStr, durationStr] = args;
      const startingBid = parseInt(startBidStr);
      const duration = parseInt(durationStr);

      if (
        !item ||
        !startBidStr ||
        !durationStr ||
        isNaN(startingBid) ||
        isNaN(duration) ||
        startingBid < 1 ||
        duration < 1 ||
        duration > 168
      ) {
        return message.reply(
          '❌ Usage: `//auction create <item> <starting_bid> <hours>`\n' +
            'Example: `//auction create Legendary Sword 5000 24`\n' +
            'Max duration: 168 hours (7 days)'
        );
      }

      // Check if user has the item
      const inventory = db.get('inventory', message.author.id) || [];
      const itemIndex = inventory.findIndex(
        i => i.name.toLowerCase() === item.toLowerCase()
      );

      if (itemIndex === -1) {
        return message.reply("❌ You don't have that item!");
      }

      // Remove item from inventory
      const itemData = inventory.splice(itemIndex, 1)[0];
      db.set('inventory', message.author.id, inventory);

      // Create auction
      const auctionId = Date.now().toString();
      const auctions = db.get('auctions', message.guild.id) || [];

      const endTime = Date.now() + duration * 60 * 60 * 1000;

      auctions.push({
        id: auctionId,
        item: itemData.name,
        sellerId: message.author.id,
        startingBid,
        currentBid: startingBid,
        highestBidder: null,
        bids: [],
        startTime: Date.now(),
        endTime,
        ended: false,
      });

      db.set('auctions', message.guild.id, auctions);

      return message.reply(
        `✅ Auction created for **${itemData.name}**!\n` +
          `Starting bid: **${branding.formatNumber(startingBid)}** coins\n` +
          `Ends: <t:${Math.floor(endTime / 1000)}:R>\n` +
          `Auction ID: \`${auctionId}\``
      );
    }

    if (action === 'list') {
      const auctions = db.get('auctions', message.guild.id) || [];
      const activeAuctions = auctions.filter(
        a => !a.ended && a.endTime > Date.now()
      );

      if (activeAuctions.length === 0) {
        return message.reply('📭 No active auctions!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('⚖️ Active Auctions')
        .setDescription(
          activeAuctions
            .slice(0, 10)
            .map(
              (a, i) =>
                `**${i + 1}. ${a.item}**\n` +
                `💰 Current Bid: ${branding.formatNumber(a.currentBid)} coins\n` +
                `👤 Highest Bidder: ${a.highestBidder ? `<@${a.highestBidder}>` : 'None yet'}\n` +
                `⏰ Ends: <t:${Math.floor(a.endTime / 1000)}:R>\n` +
                `🆔 ID: \`${a.id}\``
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'bid') {
      const [, auctionId, bidStr] = args;
      const bidAmount = parseInt(bidStr);

      if (!auctionId || !bidStr || isNaN(bidAmount) || bidAmount < 1) {
        return message.reply(
          '❌ Usage: `//auction bid <auction_id> <amount>`'
        );
      }

      const auctions = db.get('auctions', message.guild.id) || [];
      const auction = auctions.find(a => a.id === auctionId);

      if (!auction || auction.ended || auction.endTime < Date.now()) {
        return message.reply('❌ Auction not found or has ended!');
      }

      if (auction.sellerId === message.author.id) {
        return message.reply("❌ You can't bid on your own auction!");
      }

      // Check minimum bid (10% higher than current)
      const minBid = Math.ceil(auction.currentBid * 1.1);

      if (bidAmount < minBid) {
        return message.reply(
          `❌ Minimum bid is **${branding.formatNumber(minBid)}** coins (10% higher than current bid)!`
        );
      }

      // Check user has enough money
      const userData = db.get('users', message.author.id) || { wallet: 0 };

      if (userData.wallet < bidAmount) {
        return message.reply(
          `❌ You need **${branding.formatNumber(bidAmount)}** coins but only have **${branding.formatNumber(userData.wallet)}**!`
        );
      }

      // Refund previous highest bidder
      if (auction.highestBidder) {
        const prevBidderData = db.get('users', auction.highestBidder) || {
          wallet: 0,
        };
        prevBidderData.wallet += auction.currentBid;
        db.set('users', auction.highestBidder, prevBidderData);

        // Notify previous bidder
        try {
          const prevBidder = await message.client.users.fetch(
            auction.highestBidder
          );
          await prevBidder.send(
            `⚠️ You've been outbid on **${auction.item}**!\n` +
              `Your bid of **${branding.formatNumber(auction.currentBid)}** has been refunded.`
          );
        } catch (error) {
          // DMs disabled
        }
      }

      // Place new bid
      userData.wallet -= bidAmount;
      db.set('users', message.author.id, userData);

      auction.currentBid = bidAmount;
      auction.highestBidder = message.author.id;
      auction.bids.push({
        bidderId: message.author.id,
        amount: bidAmount,
        timestamp: Date.now(),
      });

      db.set('auctions', message.guild.id, auctions);

      return message.reply(
        `✅ Bid placed! You're now the highest bidder at **${branding.formatNumber(bidAmount)}** coins!`
      );
    }

    if (action === 'end') {
      const auctionId = args[1];

      if (!auctionId) {
        return message.reply('❌ Please provide an auction ID!');
      }

      const auctions = db.get('auctions', message.guild.id) || [];
      const auction = auctions.find(a => a.id === auctionId);

      if (!auction) {
        return message.reply('❌ Auction not found!');
      }

      if (auction.sellerId !== message.author.id) {
        return message.reply("❌ You can only end your own auctions!");
      }

      if (auction.ended) {
        return message.reply('❌ This auction has already ended!');
      }

      return endAuction(message, auction, auctions);
    }
  },
};

async function endAuction(message, auction, auctions) {
  auction.ended = true;

  if (!auction.highestBidder) {
    // No bids - return item to seller
    const inventory = db.get('inventory', auction.sellerId) || [];
    inventory.push({
      name: auction.item,
      acquiredAt: Date.now(),
    });
    db.set('inventory', auction.sellerId, inventory);

    db.set('auctions', message.guild.id, auctions);

    return message.reply(
      `✅ Auction ended with no bids. **${auction.item}** returned to your inventory.`
    );
  }

  // Transfer item to winner
  const winnerInventory = db.get('inventory', auction.highestBidder) || [];
  winnerInventory.push({
    name: auction.item,
    acquiredAt: Date.now(),
  });
  db.set('inventory', auction.highestBidder, winnerInventory);

  // Pay seller
  const sellerData = db.get('users', auction.sellerId) || { wallet: 0 };
  sellerData.wallet += auction.currentBid;
  db.set('users', auction.sellerId, sellerData);

  db.set('auctions', message.guild.id, auctions);

  // Notify winner
  try {
    const winner = await message.client.users.fetch(auction.highestBidder);
    await winner.send(
      `🎉 You won the auction for **${auction.item}**!\n` +
        `Final bid: **${branding.formatNumber(auction.currentBid)}** coins`
    );
  } catch (error) {
    // DMs disabled
  }

  return message.reply(
    `✅ Auction ended! Winner: <@${auction.highestBidder}>\n` +
      `Final bid: **${branding.formatNumber(auction.currentBid)}** coins`
  );
}
