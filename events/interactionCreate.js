const logger = require('../utils/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    try {
      // Handle trade buttons
      if (interaction.customId.startsWith('trade_')) {
        const tradeCommand = require('../commands/economy/trade');
        if (tradeCommand.handleTradeButton) {
          return await tradeCommand.handleTradeButton(interaction);
        }
      }

      // Handle marriage buttons
      if (interaction.customId.startsWith('marry_')) {
        const marryCommand = require('../commands/social/marry');
        if (marryCommand.handleMarriageButton) {
          return await marryCommand.handleMarriageButton(interaction);
        }
      }

      // Handle prestige buttons
      if (interaction.customId.startsWith('prestige_')) {
        const prestigeCommand = require('../commands/economy/prestige');
        if (prestigeCommand.handlePrestigeButton) {
          return await prestigeCommand.handlePrestigeButton(interaction);
        }
      }

      // Handle pet buttons (will be added later)
      if (interaction.customId.startsWith('pet_')) {
        const petCommand = require('../commands/fun/pet');
        if (petCommand.handlePetButton) {
          return await petCommand.handlePetButton(interaction);
        }
      }

      // Handle auction buttons (will be added later)
      if (interaction.customId.startsWith('auction_')) {
        const auctionCommand = require('../commands/economy/auction');
        if (auctionCommand.handleAuctionButton) {
          return await auctionCommand.handleAuctionButton(interaction);
        }
      }

      // Handle role menu buttons
      if (interaction.customId.startsWith('rolemenu_')) {
        const roleMenuCommand = require('../commands/admin/rolemenu');
        if (roleMenuCommand.handleRoleMenuButton) {
          return await roleMenuCommand.handleRoleMenuButton(interaction);
        }
      }
    } catch (error) {
      logger.error('Error handling button interaction:', error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: '❌ An error occurred while processing this interaction.',
            ephemeral: true,
          })
          .catch(() => {});
      }
    }
  },
};
