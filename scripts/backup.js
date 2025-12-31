/**
 * Manual Backup Script
 * Run with: npm run db:backup
 */

const path = require('path');
const backup = require('../utils/backup');
const logger = require('../utils/logger');

async function main() {
  try {
    logger.info('Starting manual database backup...');

    const result = backup.createBackup();

    if (result.success) {
      logger.success('Backup created successfully!');
      logger.info(`File: ${result.filename}`);
      logger.info(`Size: ${result.size}`);
      logger.info(`Path: ${result.path}`);

      // List all backups
      const backups = backup.listBackups();
      logger.info(`\nTotal backups: ${backups.length}`);

      if (backups.length > 0) {
        logger.info('\nRecent backups:');
        backups.slice(0, 5).forEach((b, i) => {
          const date = new Date(b.created).toLocaleString();
          const sizeMB = (b.size / 1024 / 1024).toFixed(2);
          logger.info(`  ${i + 1}. ${b.name} (${sizeMB} MB) - ${date}`);
        });
      }

      process.exit(0);
    } else {
      logger.error('Backup failed!');
      if (result.error) {
        logger.error(`Error: ${result.error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    logger.error('Backup script error:', error);
    process.exit(1);
  }
}

main();
