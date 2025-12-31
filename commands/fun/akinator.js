const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} = require('discord.js');

module.exports = {
  name: 'akinator',
  description: 'Play a simplified Akinator-style guessing game',
  usage: '',
  aliases: ['guess', 'guesswho'],
  category: 'fun',
  cooldown: 10,
  async execute(message, _args) {
    const characters = [
      {
        name: 'Mario',
        clues: ['video game character', 'wears red', 'plumber', 'Italian'],
      },
      {
        name: 'Pikachu',
        clues: ['Pokemon', 'yellow', 'electric type', 'mouse'],
      },
      {
        name: 'Batman',
        clues: ['superhero', 'wears black', 'rich', 'no superpowers'],
      },
      {
        name: 'Elsa',
        clues: ['Disney character', 'ice powers', 'queen', 'blonde'],
      },
      {
        name: 'Harry Potter',
        clues: ['wizard', 'wears glasses', 'has a scar', 'British'],
      },
      {
        name: 'SpongeBob',
        clues: ['lives underwater', 'yellow', 'works at restaurant', 'square'],
      },
      {
        name: 'Sonic',
        clues: ['video game character', 'blue', 'very fast', 'hedgehog'],
      },
      {
        name: 'Iron Man',
        clues: ['superhero', 'wears armor', 'genius', 'billionaire'],
      },
      {
        name: 'Darth Vader',
        clues: ['Star Wars', 'wears black', 'villain', 'father'],
      },
      {
        name: 'Mickey Mouse',
        clues: ['Disney character', 'mouse', 'wears red shorts', 'iconic'],
      },
    ];

    const character = characters[Math.floor(Math.random() * characters.length)];
    let clueIndex = 0;
    let guesses = 3;

    const getEmbed = () => {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle('🔮 Akinator Game')
        .setDescription(
          "I'm thinking of a character...\n\n" +
            `**Clues:**\n` +
            character.clues
              .slice(0, clueIndex + 1)
              .map((clue, i) => `${i + 1}. ${clue}`)
              .join('\n') +
            `\n\n**Guesses remaining:** ${guesses}\n\n` +
            'Type your guess in chat or click buttons below!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return embed;
    };

    const getButtons = () => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('aki_clue')
          .setLabel('Get Another Clue')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(clueIndex >= character.clues.length - 1),
        new ButtonBuilder()
          .setCustomId('aki_give_up')
          .setLabel('Give Up')
          .setStyle(ButtonStyle.Danger)
      );
    };

    const gameMsg = await message.reply({
      embeds: [getEmbed()],
      components: [getButtons()],
    });

    const filter = m =>
      m.author.id === message.author.id && m.channel.id === message.channel.id;

    const messageCollector = message.channel.createMessageCollector({
      filter,
      time: 60000,
    });

    const buttonCollector = gameMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    let gameEnded = false;

    messageCollector.on('collect', async m => {
      if (gameEnded) return;

      const guess = m.content.toLowerCase().trim();
      const correctAnswer = character.name.toLowerCase();

      if (guess === correctAnswer) {
        gameEnded = true;
        messageCollector.stop();
        buttonCollector.stop();

        const winEmbed = new EmbedBuilder()
          .setColor(branding.colors.success)
          .setTitle('🎉 Correct!')
          .setDescription(
            `You guessed it! The character was **${character.name}**!\n\n` +
              `You used ${clueIndex + 1} clue(s) and had ${guesses} guess(es) remaining.`
          )
          .setTimestamp();

        await gameMsg.edit({ embeds: [winEmbed], components: [] });
        await m.react('✅');
      } else {
        guesses--;

        if (guesses === 0) {
          gameEnded = true;
          messageCollector.stop();
          buttonCollector.stop();

          const loseEmbed = new EmbedBuilder()
            .setColor(branding.colors.error)
            .setTitle('❌ Game Over!')
            .setDescription(
              'You ran out of guesses!\n\n' +
                `The character was **${character.name}**.`
            )
            .setTimestamp();

          await gameMsg.edit({ embeds: [loseEmbed], components: [] });
        } else {
          await m.react('❌');
          await gameMsg.edit({
            embeds: [getEmbed()],
            components: [getButtons()],
          });
        }
      }
    });

    buttonCollector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: '❌ This is not your game!',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (interaction.customId === 'aki_clue') {
        clueIndex++;
        await interaction.update({
          embeds: [getEmbed()],
          components: [getButtons()],
        });
      } else if (interaction.customId === 'aki_give_up') {
        gameEnded = true;
        messageCollector.stop();
        buttonCollector.stop();

        const giveUpEmbed = new EmbedBuilder()
          .setColor(branding.colors.warning)
          .setTitle('🏳️ You Gave Up!')
          .setDescription(`The character was **${character.name}**.`)
          .setTimestamp();

        await interaction.update({ embeds: [giveUpEmbed], components: [] });
      }
    });

    messageCollector.on('end', () => {
      if (!gameEnded) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(branding.colors.error)
          .setTitle("⏱️ Time's Up!")
          .setDescription(`The character was **${character.name}**.`)
          .setTimestamp();

        gameMsg.edit({ embeds: [timeoutEmbed], components: [] });
      }
    });
  },
};
