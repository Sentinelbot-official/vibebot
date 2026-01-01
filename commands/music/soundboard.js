const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
const db = require('../../utils/database');
const branding = require('../../utils/branding');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'soundboard',
  description: 'Play custom sounds in voice channel',
  usage: '//soundboard [sound_name] or //soundboard list',
  aliases: ['sound', 'sb'],
  category: 'music',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    // List available sounds
    if (action === 'list' || !action) {
      const sounds = db.get('soundboard', message.guild.id) || {};
      const soundList = Object.keys(sounds);

      if (soundList.length === 0) {
        return message.reply(
          '❌ No sounds available!\n' +
            'Admins can add sounds with: `//soundboard add <name> <url>`'
        );
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🔊 Available Sounds')
        .setDescription(
          soundList.map(name => `• \`${name}\``).join('\n') ||
            'No sounds available'
        )
        .setFooter({
          text: `${branding.footers.default.text} | Use //soundboard <name> to play`,
          iconURL: branding.footers.default.iconURL,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Admin commands
    if (action === 'add' || action === 'remove') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('❌ You need Manage Server permission!');
      }

      if (action === 'add') {
        const name = args[1]?.toLowerCase();
        const url = args[2];

        if (!name || !url) {
          return message.reply(
            '❌ Usage: `//soundboard add <name> <url>`\n' +
              'URL must be a direct link to an MP3/WAV file'
          );
        }

        if (name.length > 20) {
          return message.reply('❌ Sound name must be 20 characters or less!');
        }

        const sounds = db.get('soundboard', message.guild.id) || {};
        sounds[name] = url;
        db.set('soundboard', message.guild.id, sounds);

        return message.reply(`✅ Added sound: **${name}**`);
      }

      if (action === 'remove') {
        const name = args[1]?.toLowerCase();

        if (!name) {
          return message.reply('❌ Usage: `//soundboard remove <name>`');
        }

        const sounds = db.get('soundboard', message.guild.id) || {};

        if (!sounds[name]) {
          return message.reply(`❌ Sound **${name}** not found!`);
        }

        delete sounds[name];
        db.set('soundboard', message.guild.id, sounds);

        return message.reply(`✅ Removed sound: **${name}**`);
      }
    }

    // Play sound
    const soundName = action;
    const sounds = db.get('soundboard', message.guild.id) || {};
    const soundUrl = sounds[soundName];

    if (!soundUrl) {
      return message.reply(
        `❌ Sound **${soundName}** not found!\n` +
          'Use `//soundboard list` to see available sounds.'
      );
    }

    // Check if user is in voice channel
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ You need to be in a voice channel!');
    }

    // Check bot permissions
    if (
      !voiceChannel
        .permissionsFor(message.guild.members.me)
        .has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])
    ) {
      return message.reply(
        '❌ I need Connect and Speak permissions in your voice channel!'
      );
    }

    try {
      // Join voice channel
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      // Create audio player
      const player = createAudioPlayer();
      const resource = createAudioResource(soundUrl);

      connection.subscribe(player);
      player.play(resource);

      message.react('🔊');

      // Leave after sound finishes
      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      // Handle errors
      player.on('error', error => {
        console.error('Soundboard error:', error);
        connection.destroy();
        message.reply('❌ Failed to play sound!');
      });

      // Auto-disconnect after 10 seconds
      setTimeout(() => {
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
          connection.destroy();
        }
      }, 10000);
    } catch (error) {
      console.error('Soundboard error:', error);
      message.reply('❌ Failed to play sound!');
    }
  },
};
