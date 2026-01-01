const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
  joinVoiceChannel,
  EndBehaviorType,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const prism = require('prism-media');
const path = require('path');
const fs = require('fs');
const branding = require('../../utils/branding');

// Active recordings
const recordings = new Map();

module.exports = {
  name: 'record',
  description: 'Record voice channel audio (Premium)',
  usage: '//record <start/stop>',
  aliases: ['rec', 'voicerecord'],
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    // Check premium status
    const db = require('../../utils/database');
    const guildData = db.get('guilds', message.guild.id) || {};
    if (guildData.premiumTier !== 'vip') {
      return message.reply(
        '❌ This feature requires VIP premium!\n' +
          'Use `//premium` to learn more.'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['start', 'stop'].includes(action)) {
      return message.reply(
        '❌ Usage: `//record <start/stop>`\n\n' +
          '**Note:** Voice recording requires explicit consent from all participants. ' +
          'Make sure everyone in the voice channel is aware they are being recorded.'
      );
    }

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply('❌ You need to be in a voice channel!');
    }

    if (action === 'start') {
      if (recordings.has(voiceChannel.id)) {
        return message.reply('❌ Already recording in this channel!');
      }

      // Check permissions
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
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
          selfDeaf: false,
        });

        // Create recordings directory
        const recordingsDir = path.join(__dirname, '../../recordings');
        if (!fs.existsSync(recordingsDir)) {
          fs.mkdirSync(recordingsDir, { recursive: true });
        }

        const timestamp = Date.now();
        const filename = `${message.guild.id}_${voiceChannel.id}_${timestamp}.pcm`;
        const filepath = path.join(recordingsDir, filename);

        // Store recording info
        recordings.set(voiceChannel.id, {
          connection,
          filepath,
          startTime: timestamp,
          userId: message.author.id,
          streams: new Map(),
        });

        // Listen to users
        connection.receiver.speaking.on('start', userId => {
          const recording = recordings.get(voiceChannel.id);
          if (!recording) return;

          const audioStream = connection.receiver.subscribe(userId, {
            end: {
              behavior: EndBehaviorType.AfterSilence,
              duration: 100,
            },
          });

          const oggStream = new prism.opus.Decoder({
            frameSize: 960,
            channels: 2,
            rate: 48000,
          });

          const userFile = path.join(
            recordingsDir,
            `${timestamp}_${userId}.pcm`
          );
          const writeStream = createWriteStream(userFile);

          pipeline(audioStream, oggStream, writeStream, err => {
            if (err) {
              console.error('Recording pipeline error:', err);
            }
          });

          recording.streams.set(userId, { audioStream, writeStream });
        });

        const embed = new EmbedBuilder()
          .setColor(branding.colors.error)
          .setTitle('🔴 Recording Started')
          .setDescription(
            `Recording audio in ${voiceChannel}...\n\n` +
              '⚠️ **IMPORTANT:** All participants are being recorded.\n' +
              'Use `//record stop` to end the recording.'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        message.reply({ embeds: [embed] });

        // Send notice to voice channel
        const noticeEmbed = new EmbedBuilder()
          .setColor(branding.colors.error)
          .setTitle('⚠️ RECORDING IN PROGRESS')
          .setDescription(
            'This voice channel is currently being recorded.\n' +
              'If you do not consent, please leave the channel.'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        message.channel.send({ embeds: [noticeEmbed] });
      } catch (error) {
        console.error('Recording start error:', error);
        message.reply('❌ Failed to start recording!');
      }
    }

    if (action === 'stop') {
      const recording = recordings.get(voiceChannel.id);

      if (!recording) {
        return message.reply('❌ No active recording in this channel!');
      }

      if (recording.userId !== message.author.id) {
        return message.reply(
          '❌ Only the person who started the recording can stop it!'
        );
      }

      try {
        // Close all streams
        for (const [userId, streams] of recording.streams) {
          streams.writeStream.end();
        }

        // Disconnect
        recording.connection.destroy();

        const duration = Math.floor((Date.now() - recording.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        recordings.delete(voiceChannel.id);

        const embed = new EmbedBuilder()
          .setColor(branding.colors.success)
          .setTitle('⏹️ Recording Stopped')
          .setDescription(
            `Recording saved!\n\n` +
              `**Duration:** ${minutes}m ${seconds}s\n` +
              `**Participants:** ${recording.streams.size}\n\n` +
              '⚠️ **Note:** Recordings are stored locally on the bot server.\n' +
              'Contact the bot owner to access recordings.'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Recording stop error:', error);
        message.reply('❌ Failed to stop recording!');
      }
    }
  },
};
