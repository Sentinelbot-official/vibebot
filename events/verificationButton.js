const db = require('../utils/database');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'verify_button') {
      const settings = db.get('guild_settings', interaction.guild.id) || {};
      const verifySettings = settings.verification;

      if (!verifySettings || !verifySettings.enabled) {
        return interaction.reply({
          content: '❌ Verification system is not set up!',
          ephemeral: true,
        });
      }

      const role = interaction.guild.roles.cache.get(verifySettings.roleId);
      if (!role) {
        return interaction.reply({
          content: '❌ Verification role not found!',
          ephemeral: true,
        });
      }

      // Check if already verified
      if (interaction.member.roles.cache.has(role.id)) {
        return interaction.reply({
          content: '✅ You are already verified!',
          ephemeral: true,
        });
      }

      try {
        await interaction.member.roles.add(role);
        await interaction.reply({
          content: `✅ You have been verified! You now have the ${role} role.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error('Error verifying member:', error);
        await interaction.reply({
          content: '❌ Failed to verify you!',
          ephemeral: true,
        });
      }
    }
  },
};
