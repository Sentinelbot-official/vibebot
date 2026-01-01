const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'suggest',
  aliases: ['suggestion', 'idea'],
  description: 'Submit suggestions with community voting',
  usage: '<suggestion text>',
  category: 'utility',
  cooldown: 60,
  guildOnly: true,
  async execute(message, args) {
    const subcommand = args[0]?.toLowerCase();

    // Setup command (admin only)
    if (subcommand === 'setup') {
      if (
        !message.member.permissions.has(PermissionFlagsBits.ManageGuild)
      ) {
        return message.reply(
          '❌ You need **Manage Server** permission to set up suggestions!'
        );
      }

      const channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[1]);

      if (!channel) {
        return message.reply(
          '❌ Please mention a channel!\nUsage: `//suggest setup #suggestions`'
        );
      }

      const config = db.get('suggestion_config', message.guild.id) || {};
      config.channelId = channel.id;
      config.enabled = true;
      db.set('suggestion_config', message.guild.id, config);

      return message.reply(
        `✅ Suggestions channel set to ${channel}!\nMembers can now use \`//suggest <idea>\``
      );
    }

    // List suggestions
    if (subcommand === 'list') {
      const suggestions = db.get('suggestions', message.guild.id) || {};
      const suggestionList = Object.values(suggestions)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);

      if (suggestionList.length === 0) {
        return message.reply('📭 No suggestions yet!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('💡 Recent Suggestions')
        .setDescription(
          suggestionList
            .map(s => {
              const status = s.status === 'approved' ? '✅' : s.status === 'denied' ? '❌' : '⏳';
              const votes = s.upvotes - s.downvotes;
              return (
                `${status} **#${s.id}** - ${s.suggestion.substring(0, 50)}...\n` +
                `👍 ${s.upvotes} | 👎 ${s.downvotes} | Net: ${votes > 0 ? '+' : ''}${votes}`
              );
            })
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Approve/Deny suggestions (admin only)
    if (subcommand === 'approve' || subcommand === 'deny') {
      if (
        !message.member.permissions.has(PermissionFlagsBits.ManageGuild)
      ) {
        return message.reply(
          '❌ You need **Manage Server** permission to manage suggestions!'
        );
      }

      const suggestionId = args[1];
      const reason = args.slice(2).join(' ') || 'No reason provided';

      if (!suggestionId) {
        return message.reply('❌ Please provide a suggestion ID!');
      }

      const suggestions = db.get('suggestions', message.guild.id) || {};
      const suggestion = suggestions[suggestionId];

      if (!suggestion) {
        return message.reply('❌ Suggestion not found!');
      }

      suggestion.status = subcommand === 'approve' ? 'approved' : 'denied';
      suggestion.reviewedBy = message.author.id;
      suggestion.reviewedAt = Date.now();
      suggestion.reviewReason = reason;

      db.set('suggestions', message.guild.id, suggestions);

      // Update original message
      const config = db.get('suggestion_config', message.guild.id);
      if (config && config.channelId) {
        const channel = message.guild.channels.cache.get(config.channelId);
        if (channel) {
          try {
            const msg = await channel.messages.fetch(suggestion.messageId);
            const updatedEmbed = EmbedBuilder.from(msg.embeds[0])
              .setColor(
                subcommand === 'approve'
                  ? branding.colors.success
                  : branding.colors.error
              )
              .addFields({
                name:
                  subcommand === 'approve'
                    ? '✅ Approved'
                    : '❌ Denied',
                value: `**Reason:** ${reason}\n**By:** <@${message.author.id}>`,
                inline: false,
              });

            await msg.edit({ embeds: [updatedEmbed], components: [] });
          } catch (error) {
            console.error('Error updating suggestion message:', error);
          }
        }
      }

      return message.reply(
        `✅ Suggestion #${suggestionId} has been ${subcommand === 'approve' ? 'approved' : 'denied'}!`
      );
    }

    // Submit a suggestion
    const config = db.get('suggestion_config', message.guild.id);

    if (!config || !config.enabled) {
      return message.reply(
        '❌ Suggestions are not enabled in this server!\n' +
          'An admin can enable them with `//suggest setup #channel`'
      );
    }

    const suggestionText = args.join(' ');

    if (!suggestionText) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('💡 Suggestion System')
        .setDescription(
          '**Share your ideas with the community!**\n\n' +
            '**Usage:**\n' +
            '`//suggest <your idea>`\n\n' +
            '**Example:**\n' +
            '`//suggest Add a music bot to the server`\n\n' +
            '**Features:**\n' +
            '• Community voting (👍/👎)\n' +
            '• Admin approval system\n' +
            '• Track suggestion status\n' +
            '• View popular suggestions'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (suggestionText.length > 1000) {
      return message.reply('❌ Suggestion too long! Max 1000 characters.');
    }

    const channel = message.guild.channels.cache.get(config.channelId);

    if (!channel) {
      return message.reply(
        '❌ Suggestions channel not found! Please contact an admin.'
      );
    }

    const suggestionId = Date.now().toString().slice(-6);
    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle(`💡 Suggestion #${suggestionId}`)
      .setDescription(suggestionText)
      .addFields(
        { name: '👍 Upvotes', value: '0', inline: true },
        { name: '👎 Downvotes', value: '0', inline: true },
        { name: '📊 Status', value: '⏳ Pending', inline: true }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`suggestion_upvote_${suggestionId}`)
        .setLabel('Upvote')
        .setEmoji('👍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`suggestion_downvote_${suggestionId}`)
        .setLabel('Downvote')
        .setEmoji('👎')
        .setStyle(ButtonStyle.Danger)
    );

    const suggestionMsg = await channel.send({
      embeds: [embed],
      components: [row],
    });

    // Store suggestion
    const suggestions = db.get('suggestions', message.guild.id) || {};
    suggestions[suggestionId] = {
      id: suggestionId,
      suggestion: suggestionText,
      authorId: message.author.id,
      messageId: suggestionMsg.id,
      channelId: channel.id,
      upvotes: 0,
      downvotes: 0,
      voters: [],
      status: 'pending',
      createdAt: Date.now(),
    };
    db.set('suggestions', message.guild.id, suggestions);

    // Set up voting collector
    const collector = suggestionMsg.createMessageComponentCollector({
      time: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    collector.on('collect', async interaction => {
      const suggestions = db.get('suggestions', message.guild.id) || {};
      const suggestion = suggestions[suggestionId];

      if (!suggestion) return;

      if (suggestion.voters.includes(interaction.user.id)) {
        return interaction.reply({
          content: '⚠️ You already voted on this suggestion!',
          ephemeral: true,
        });
      }

      const voteType = interaction.customId.includes('upvote')
        ? 'upvote'
        : 'downvote';

      if (voteType === 'upvote') {
        suggestion.upvotes++;
      } else {
        suggestion.downvotes++;
      }

      suggestion.voters.push(interaction.user.id);
      db.set('suggestions', message.guild.id, suggestions);

      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      updatedEmbed.spliceFields(0, 2,
        { name: '👍 Upvotes', value: suggestion.upvotes.toString(), inline: true },
        { name: '👎 Downvotes', value: suggestion.downvotes.toString(), inline: true }
      );

      await interaction.update({ embeds: [updatedEmbed] });

      await interaction.followUp({
        content: `✅ Vote recorded!`,
        ephemeral: true,
      });
    });

    await message.reply(
      `✅ Your suggestion has been submitted to ${channel}!\n` +
        `**Suggestion ID:** #${suggestionId}`
    );
  },
};
