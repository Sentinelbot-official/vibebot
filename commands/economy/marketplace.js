const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'marketplace',
  aliases: ['market', 'trade'],
  description: 'Buy and sell items with other users',
  usage: '<list/sell/buy/cancel>',
  category: 'economy',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['list', 'sell', 'buy', 'cancel'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('🏪 Trading Marketplace')
        .setDescription(
          '**Trade items with other users!**\n\n' +
            '**Commands:**\n' +
            '`//marketplace list` - View active listings\n' +
            '`//marketplace sell <item> <price>` - List item for sale\n' +
            '`//marketplace buy <listing_id>` - Buy a listing\n' +
            '`//marketplace cancel <listing_id>` - Cancel your listing\n\n' +
            '**Features:**\n' +
            '• Safe peer-to-peer trading\n' +
            '• Automatic transactions\n' +
            '• 5% marketplace fee\n' +
            '• Item verification'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'list') {
      const listings = db.get('marketplace', message.guild.id) || [];
      const activeListings = listings.filter(l => !l.sold && !l.cancelled);

      if (activeListings.length === 0) {
        return message.reply('📭 No active listings in the marketplace!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('🏪 Active Marketplace Listings')
        .setDescription(
          activeListings
            .slice(0, 10)
            .map(
              (l, i) =>
                `**${i + 1}. ${l.item}**\n` +
                `💰 Price: ${branding.formatNumber(l.price)} coins\n` +
                `👤 Seller: <@${l.sellerId}>\n` +
                `🆔 ID: \`${l.id}\``
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'sell') {
      const [, item, priceStr] = args;
      const price = parseInt(priceStr);

      if (!item || !priceStr || isNaN(price) || price < 1) {
        return message.reply(
          '❌ Usage: `//marketplace sell <item> <price>`\n' +
            'Example: `//marketplace sell Rare Sword 1000`'
        );
      }

      // Check if user has the item
      const inventory = db.get('inventory', message.author.id) || [];
      const itemIndex = inventory.findIndex(
        i => i.name.toLowerCase() === item.toLowerCase()
      );

      if (itemIndex === -1) {
        return message.reply("❌ You don't have that item in your inventory!");
      }

      // Remove item from inventory
      const itemData = inventory.splice(itemIndex, 1)[0];
      db.set('inventory', message.author.id, inventory);

      // Create listing
      const listingId = Date.now().toString();
      const listings = db.get('marketplace', message.guild.id) || [];

      listings.push({
        id: listingId,
        item: itemData.name,
        price,
        sellerId: message.author.id,
        listedAt: Date.now(),
        sold: false,
        cancelled: false,
      });

      db.set('marketplace', message.guild.id, listings);

      return message.reply(
        `✅ Listed **${itemData.name}** for **${branding.formatNumber(price)}** coins!\n` +
          `Listing ID: \`${listingId}\``
      );
    }

    if (action === 'buy') {
      const listingId = args[1];

      if (!listingId) {
        return message.reply('❌ Please provide a listing ID!');
      }

      const listings = db.get('marketplace', message.guild.id) || [];
      const listing = listings.find(l => l.id === listingId);

      if (!listing || listing.sold || listing.cancelled) {
        return message.reply('❌ Listing not found or no longer available!');
      }

      if (listing.sellerId === message.author.id) {
        return message.reply("❌ You can't buy your own listing!");
      }

      // Check buyer has enough money
      const buyerData = db.get('users', message.author.id) || { wallet: 0 };

      if (buyerData.wallet < listing.price) {
        return message.reply(
          `❌ You need **${branding.formatNumber(listing.price)}** coins but only have **${branding.formatNumber(buyerData.wallet)}**!`
        );
      }

      // Calculate marketplace fee (5%)
      const fee = Math.floor(listing.price * 0.05);
      const sellerReceives = listing.price - fee;

      // Process transaction
      buyerData.wallet -= listing.price;
      db.set('users', message.author.id, buyerData);

      const sellerData = db.get('users', listing.sellerId) || { wallet: 0 };
      sellerData.wallet += sellerReceives;
      db.set('users', listing.sellerId, sellerData);

      // Transfer item
      const buyerInventory = db.get('inventory', message.author.id) || [];
      buyerInventory.push({
        name: listing.item,
        acquiredAt: Date.now(),
      });
      db.set('inventory', message.author.id, buyerInventory);

      // Mark as sold
      listing.sold = true;
      listing.buyerId = message.author.id;
      listing.soldAt = Date.now();
      db.set('marketplace', message.guild.id, listings);

      // Notify seller
      try {
        const seller = await message.client.users.fetch(listing.sellerId);
        await seller.send(
          `✅ Your **${listing.item}** sold for **${branding.formatNumber(listing.price)}** coins!\n` +
            `You received **${branding.formatNumber(sellerReceives)}** coins (5% marketplace fee).`
        );
      } catch (error) {
        // Seller has DMs disabled
      }

      return message.reply(
        `✅ Purchased **${listing.item}** for **${branding.formatNumber(listing.price)}** coins!`
      );
    }

    if (action === 'cancel') {
      const listingId = args[1];

      if (!listingId) {
        return message.reply('❌ Please provide a listing ID!');
      }

      const listings = db.get('marketplace', message.guild.id) || [];
      const listing = listings.find(l => l.id === listingId);

      if (!listing) {
        return message.reply('❌ Listing not found!');
      }

      if (listing.sellerId !== message.author.id) {
        return message.reply('❌ You can only cancel your own listings!');
      }

      if (listing.sold) {
        return message.reply('❌ This listing has already been sold!');
      }

      if (listing.cancelled) {
        return message.reply('❌ This listing is already cancelled!');
      }

      // Return item to seller
      const inventory = db.get('inventory', message.author.id) || [];
      inventory.push({
        name: listing.item,
        acquiredAt: Date.now(),
      });
      db.set('inventory', message.author.id, inventory);

      // Mark as cancelled
      listing.cancelled = true;
      listing.cancelledAt = Date.now();
      db.set('marketplace', message.guild.id, listings);

      return message.reply(
        `✅ Cancelled listing for **${listing.item}**. Item returned to your inventory.`
      );
    }
  },
};
