const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

module.exports = {
  name: 'wouldyourather',
  description: 'Play would you rather',
  usage: '',
  aliases: ['wyr', 'rather'],
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    const questions = [
      {
        option1: 'Have the ability to fly',
        option2: 'Have the ability to be invisible',
      },
      {
        option1: 'Live in the past',
        option2: 'Live in the future',
      },
      {
        option1: 'Be able to speak all languages',
        option2: 'Be able to talk to animals',
      },
      {
        option1: 'Have unlimited money',
        option2: 'Have unlimited time',
      },
      {
        option1: 'Never use social media again',
        option2: 'Never watch TV/movies again',
      },
      {
        option1: 'Be famous on social media',
        option2: 'Win the lottery',
      },
      {
        option1: 'Live without music',
        option2: 'Live without movies',
      },
      {
        option1: 'Be able to teleport',
        option2: 'Be able to read minds',
      },
      {
        option1: 'Have a rewind button for life',
        option2: 'Have a pause button for life',
      },
      {
        option1: 'Always be 10 minutes late',
        option2: 'Always be 20 minutes early',
      },
      {
        option1: 'Fight 100 duck-sized horses',
        option2: 'Fight 1 horse-sized duck',
      },
      {
        option1: 'Never eat pizza again',
        option2: 'Never eat burgers again',
      },
      {
        option1: 'Be stuck on a broken ski lift',
        option2: 'Be stuck in a broken elevator',
      },
      {
        option1: 'Have a personal chef',
        option2: 'Have a personal driver',
      },
      {
        option1: 'Live in a world without problems',
        option2: 'Live in a world where you rule',
      },
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];

    const votes = {
      option1: new Set(),
      option2: new Set(),
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('wyr_option1')
        .setLabel('Option 1')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1️⃣'),
      new ButtonBuilder()
        .setCustomId('wyr_option2')
        .setLabel('Option 2')
        .setStyle(ButtonStyle.Success)
        .setEmoji('2️⃣')
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤔 Would You Rather...')
      .setDescription(
        `**1️⃣ ${question.option1}**\n\n**OR**\n\n**2️⃣ ${question.option2}**\n\n` +
          `Vote by clicking the buttons below!`
      )
      .addFields(
        {
          name: 'Option 1 Votes',
          value: '0',
          inline: true,
        },
        {
          name: 'Option 2 Votes',
          value: '0',
          inline: true,
        }
      )
      .setFooter({ text: 'Poll ends in 60 seconds' })
      .setTimestamp();

    const msg = await message.reply({
      embeds: [embed],
      components: [row],
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on('collect', async interaction => {
      const userId = interaction.user.id;
      const option = interaction.customId.split('_')[1];

      // Remove from other option if already voted
      if (option === 'option1') {
        votes.option2.delete(userId);
        votes.option1.add(userId);
      } else {
        votes.option1.delete(userId);
        votes.option2.add(userId);
      }

      // Update embed
      embed.spliceFields(0, 2);
      embed.addFields(
        {
          name: 'Option 1 Votes',
          value: `${votes.option1.size}`,
          inline: true,
        },
        {
          name: 'Option 2 Votes',
          value: `${votes.option2.size}`,
          inline: true,
        }
      );

      await interaction.update({ embeds: [embed] });
    });

    collector.on('end', () => {
      const total = votes.option1.size + votes.option2.size;
      const percent1 =
        total > 0 ? Math.round((votes.option1.size / total) * 100) : 0;
      const percent2 =
        total > 0 ? Math.round((votes.option2.size / total) * 100) : 0;

      embed.setDescription(
        `**1️⃣ ${question.option1}**\n` +
          `${votes.option1.size} votes (${percent1}%)\n\n` +
          `**OR**\n\n` +
          `**2️⃣ ${question.option2}**\n` +
          `${votes.option2.size} votes (${percent2}%)\n\n` +
          `**Poll Ended!**`
      );
      embed.setFooter({ text: 'Poll ended' });
      embed.setColor(0xff0000);

      msg.edit({ embeds: [embed], components: [] });
    });
  },
};
