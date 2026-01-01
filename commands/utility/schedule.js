const { EmbedBuilder } = require('discord.js');
const twitchApi = require('../../utils/twitchApi');
const branding = require('../../utils/branding');

module.exports = {
  name: 'schedule',
  aliases: ['streamschedule', 'twitchschedule'],
  description: "View a Twitch streamer's schedule",
  usage: '<username>',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const username = args[0] || 'projectdraguk'; // Default to your channel

    const loading = await message.reply(
      `${branding.emojis.rocket} Fetching schedule for **${username}**...`
    );

    try {
      const scheduleData = await twitchApi.getSchedule(username);

      if (!scheduleData || scheduleData.segments.length === 0) {
        return loading.edit(
          `❌ No schedule found for **${username}**!\n\n` +
            `This could mean:\n` +
            `• The streamer hasn't set up a schedule\n` +
            `• The username is incorrect\n` +
            `• The schedule is currently empty`
        );
      }

      const now = Date.now();
      const upcomingStreams = scheduleData.segments
        .filter(s => s.startTime.getTime() > now)
        .slice(0, 10); // Show next 10 streams

      if (upcomingStreams.length === 0) {
        return loading.edit(
          `📅 **${username}** has no upcoming scheduled streams!`
        );
      }

      const embed = new EmbedBuilder()
        .setColor('#9146FF')
        .setAuthor({
          name: `${username}'s Stream Schedule`,
          iconURL: branding.getTwitchIconURL(),
          url: `https://twitch.tv/${username}/schedule`,
        })
        .setDescription(
          upcomingStreams
            .map((stream, index) => {
              const startTimestamp = Math.floor(
                stream.startTime.getTime() / 1000
              );
              const endTimestamp = Math.floor(stream.endTime.getTime() / 1000);
              const duration = Math.floor(
                (stream.endTime.getTime() - stream.startTime.getTime()) /
                  (1000 * 60)
              );

              return (
                `**${index + 1}. ${stream.title || 'Untitled Stream'}**\n` +
                `📺 ${stream.category}\n` +
                `🕐 <t:${startTimestamp}:F> (<t:${startTimestamp}:R>)\n` +
                `⏱️ Duration: ${duration} minutes\n` +
                `${stream.isRecurring ? '🔁 Recurring' : ''}`
              );
            })
            .join('\n\n')
        )
        .setFooter({
          text: branding.getFooterText(
            `${upcomingStreams.length} upcoming stream${upcomingStreams.length > 1 ? 's' : ''}`
          ),
          iconURL: branding.getTwitchIconURL(),
        })
        .setTimestamp();

      // Add vacation notice if applicable
      if (scheduleData.vacation) {
        embed.addFields({
          name: '🏖️ Vacation Notice',
          value: `On vacation until <t:${Math.floor(new Date(scheduleData.vacation.end_time).getTime() / 1000)}:F>`,
          inline: false,
        });
      }

      return loading.edit({
        content: null,
        embeds: [embed],
      });
    } catch (error) {
      console.error('Error fetching Twitch schedule:', error);
      return loading.edit(
        `${branding.emojis.error} Failed to fetch schedule! The Twitch API might be down or the username is invalid.`
      );
    }
  },
};
