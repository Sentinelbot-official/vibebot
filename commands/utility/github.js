const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  name: 'github',
  description: 'Get information about a GitHub repository',
  usage: '<owner/repo>',
  aliases: ['gh', 'repo'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a repository! Usage: `github <owner/repo>`\nExample: `github discordjs/discord.js`'
      );
    }

    const repo = args[0];
    const parts = repo.split('/');

    if (parts.length !== 2) {
      return message.reply(
        '❌ Invalid format! Use: `github <owner/repo>`\nExample: `github discordjs/discord.js`'
      );
    }

    const [owner, repoName] = parts;

    try {
      const repoData = await fetchGitHubRepo(owner, repoName);

      const embed = new EmbedBuilder()
        .setColor(0x238636)
        .setTitle(`📦 ${repoData.fullName}`)
        .setURL(repoData.url)
        .setDescription(repoData.description || 'No description provided')
        .setThumbnail(repoData.ownerAvatar)
        .addFields(
          {
            name: '⭐ Stars',
            value: repoData.stars.toLocaleString(),
            inline: true,
          },
          {
            name: '🍴 Forks',
            value: repoData.forks.toLocaleString(),
            inline: true,
          },
          {
            name: '👁️ Watchers',
            value: repoData.watchers.toLocaleString(),
            inline: true,
          },
          {
            name: '📝 Language',
            value: repoData.language || 'N/A',
            inline: true,
          },
          {
            name: '📄 License',
            value: repoData.license || 'None',
            inline: true,
          },
          {
            name: '🐛 Open Issues',
            value: repoData.openIssues.toLocaleString(),
            inline: true,
          },
          { name: '📅 Created', value: repoData.created, inline: true },
          { name: '🔄 Updated', value: repoData.updated, inline: true },
          {
            name: '📊 Size',
            value: `${(repoData.size / 1024).toFixed(2)} MB`,
            inline: true,
          }
        )
        .setFooter({
          text: `${repoData.isPrivate ? '🔒 Private' : '🌐 Public'} Repository`,
        })
        .setTimestamp();

      if (repoData.topics && repoData.topics.length > 0) {
        embed.addFields({
          name: '🏷️ Topics',
          value: repoData.topics
            .slice(0, 10)
            .map(t => `\`${t}\``)
            .join(', '),
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('GitHub command error:', error);
      return message.reply(
        '❌ Could not fetch repository data. Please check the repository name and try again.'
      );
    }
  },
};

function fetchGitHubRepo(owner, repo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}`,
      headers: {
        'User-Agent': 'Discord-Bot',
      },
    };

    https
      .get(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (json.message === 'Not Found') {
              return reject(new Error('Repository not found'));
            }

            const repoData = {
              fullName: json.full_name,
              url: json.html_url,
              description: json.description,
              ownerAvatar: json.owner.avatar_url,
              stars: json.stargazers_count,
              forks: json.forks_count,
              watchers: json.watchers_count,
              language: json.language,
              license: json.license?.name,
              openIssues: json.open_issues_count,
              created: new Date(json.created_at).toLocaleDateString(),
              updated: new Date(json.updated_at).toLocaleDateString(),
              size: json.size,
              isPrivate: json.private,
              topics: json.topics,
            };

            resolve(repoData);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}
