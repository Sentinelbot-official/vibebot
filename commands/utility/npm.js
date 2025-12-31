const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  name: 'npm',
  description: 'Get information about an NPM package',
  usage: '<package-name>',
  aliases: ['package', 'npmjs'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a package name! Usage: `npm <package-name>`\nExample: `npm discord.js`'
      );
    }

    const packageName = args[0].toLowerCase();

    try {
      const packageData = await fetchNPMPackage(packageName);

      const embed = new EmbedBuilder()
        .setColor(0xcc3534)
        .setTitle(`📦 ${packageData.name}`)
        .setURL(packageData.url)
        .setDescription(packageData.description || 'No description provided')
        .addFields(
          {
            name: '📌 Latest Version',
            value: packageData.version,
            inline: true,
          },
          {
            name: '📥 Weekly Downloads',
            value: packageData.downloads.toLocaleString(),
            inline: true,
          },
          {
            name: '📄 License',
            value: packageData.license || 'N/A',
            inline: true,
          },
          {
            name: '👤 Author',
            value: packageData.author || 'N/A',
            inline: true,
          },
          { name: '📅 Published', value: packageData.published, inline: true },
          { name: '🔄 Last Update', value: packageData.modified, inline: true }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      if (packageData.keywords && packageData.keywords.length > 0) {
        embed.addFields({
          name: '🏷️ Keywords',
          value: packageData.keywords
            .slice(0, 10)
            .map(k => `\`${k}\``)
            .join(', '),
          inline: false,
        });
      }

      if (
        packageData.dependencies &&
        Object.keys(packageData.dependencies).length > 0
      ) {
        const depCount = Object.keys(packageData.dependencies).length;
        embed.addFields({
          name: '📦 Dependencies',
          value: `${depCount} dependencies`,
          inline: true,
        });
      }

      if (packageData.repository) {
        embed.addFields({
          name: '🔗 Repository',
          value: `[View on GitHub](${packageData.repository})`,
          inline: true,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('NPM command error:', error);
      return message.reply(
        '❌ Could not fetch package data. Please check the package name and try again.'
      );
    }
  },
};

async function fetchNPMPackage(packageName) {
  // Fetch package info
  const packageInfo = await new Promise((resolve, reject) => {
    https
      .get(`https://registry.npmjs.org/${packageName}`, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });

  if (packageInfo.error) {
    throw new Error('Package not found');
  }

  // Fetch download stats
  const downloads = await new Promise((resolve, reject) => {
    https
      .get(
        `https://api.npmjs.org/downloads/point/last-week/${packageName}`,
        res => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json.downloads || 0);
            } catch (err) {
              resolve(0);
            }
          });
        }
      )
      .on('error', () => resolve(0));
  });

  const latestVersion = packageInfo['dist-tags']?.latest;
  const versionData = packageInfo.versions?.[latestVersion];

  const packageData = {
    name: packageInfo.name,
    version: latestVersion,
    description: packageInfo.description,
    url: `https://www.npmjs.com/package/${packageInfo.name}`,
    downloads: downloads,
    license: versionData?.license,
    author:
      typeof versionData?.author === 'string'
        ? versionData.author
        : versionData?.author?.name,
    published: new Date(packageInfo.time?.created).toLocaleDateString(),
    modified: new Date(packageInfo.time?.modified).toLocaleDateString(),
    keywords: versionData?.keywords,
    dependencies: versionData?.dependencies,
    repository:
      typeof versionData?.repository === 'string'
        ? versionData.repository
        : versionData?.repository?.url
            ?.replace(/^git\+/, '')
            .replace(/\.git$/, ''),
  };

  return packageData;
}
